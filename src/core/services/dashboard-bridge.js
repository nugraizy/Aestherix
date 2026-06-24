import express from 'express';
import fs from 'fs-extra';
import { createServer } from 'http';

import { getDashboardLogs, setDashboardCommandState, setDashboardFlagState } from '../../../dashboard/server/monitor.js';
import configuration from '../../helper/config/connect.js';
import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { banUser, getBannedUsers, getUserLimit, unbanUser, upsertUserLimit } from '../../helper/database/adapters/user.js';
import prisma from '../../helper/database/prisma.js';
import { toUserJid } from '../../helper/misc/wa_data/index.js';
import { manager } from '../manager.js';
import { getPm2SubBotLogs, getPm2SubBotStatuses, isPm2SubBotRunning, startPm2SubBot, stopPm2SubBot } from '../pm2-helpers.js';
import { color, loggers } from '../../utils/modules/index.js';

const DASHBOARD_BRIDGE_PORT = Number(process.env.DASHBOARD_BRIDGE_PORT || 4010);
const DASHBOARD_BRIDGE_TOKEN = String(process.env.DASHBOARD_BRIDGE_TOKEN || 'aestherix-local-bridge-token');
const SETTINGS_PATH = './src/helper/config/settings.json';
const S_WHATSAPP_NET = '@s.whatsapp.net';

let instance = null;

const normalizeUserJid = (input) => {
	let raw = String(input || '').trim();

	if (!raw) {
		return null;
	}

	if (raw.endsWith('@c.us')) {
		raw = raw.replace(/@c\.us$/i, S_WHATSAPP_NET);
	}

	if (raw.endsWith(S_WHATSAPP_NET)) {
		return raw.split('@')[0].replace(/\D/g, '') + S_WHATSAPP_NET || null;
	}

	if (raw.includes('@')) {
		const local = raw.split('@')[0].replace(/\D/g, '');

		return local ? `${local}${S_WHATSAPP_NET}` : null;
	}

	const digits = raw.replace(/\D/g, '');

	return digits ? `${digits}${S_WHATSAPP_NET}` : null;
};

const applyRuntimeMutation = async (waClient, type, payload = {}) => {
	if (type === 'command.toggle') {
		return setDashboardCommandState(configuration, String(payload.commandName || ''), Boolean(payload.enabled));
	}

	if (type === 'flag.toggle') {
		return setDashboardFlagState(configuration, String(payload.flagName || ''), Boolean(payload.enabled));
	}

	if (type === 'user.limit') {
		const jid = normalizeUserJid(payload.userId);

		if (!jid) {
			return { ok: false, message: 'Invalid user id.' };
		}

		const current = await getUserLimit(prisma, jid);

		await upsertUserLimit(prisma, jid, Number(payload.limit || 0), current?.role || 'FREE');

		return { ok: true, userId: jid };
	}

	if (type === 'user.premium') {
		const jid = normalizeUserJid(payload.userId);

		if (!jid) {
			return { ok: false, message: 'Invalid user id.' };
		}

		const role = Boolean(payload.enabled) ? 'PREMIUM' : 'FREE';

		await upsertUserLimit(prisma, jid, 30, role);

		return { ok: true, userId: jid };
	}

	if (type === 'user.banned') {
		const jid = normalizeUserJid(payload.userId);

		if (!jid) {
			return { ok: false, message: 'Invalid user id.' };
		}

		if (Boolean(payload.enabled)) {
			await banUser(prisma, jid);
		} else {
			await unbanUser(prisma, jid);
		}

		configuration.bannedlist = await getBannedUsers(prisma);

		return { ok: true, userId: jid };
	}

	if (type === 'user.blocked') {
		const jid = normalizeUserJid(payload.userId);

		if (!jid) {
			return { ok: false, message: 'Invalid user id.' };
		}

		if (!waClient?.updateBlockStatus) {
			return { ok: false, status: 503, message: 'WhatsApp client is not connected yet.' };
		}

		await waClient.updateBlockStatus(jid, Boolean(payload.enabled) ? 'block' : 'unblock');

		const set = new Set(Array.isArray(configuration.blocklist) ? configuration.blocklist : []);

		if (Boolean(payload.enabled)) {
			set.add(jid);
		} else {
			set.delete(jid);
		}

		configuration.blocklist = Array.from(set);

		return { ok: true, userId: jid };
	}

	if (type === 'settings.update') {
		try {
			const fresh = await fs.readJSON(SETTINGS_PATH);

			configuration.settings = fresh;
			configuration.owners = [toUserJid(fresh.owner_number), ...(fresh.team_number || []).map(toUserJid)].filter(Boolean);

			if (typeof fresh.logger_theme === 'string' && fresh.logger_theme.length > 0) {
				configuration.logger_theme = fresh.logger_theme;
				color.setTheme(fresh.logger_theme);
			}

			if (typeof fresh.packname === 'string' && fresh.packname.length > 0) {
				configuration.packname = fresh.packname;
			}

			if (typeof fresh.author === 'string' && fresh.author.length > 0) {
				configuration.author = fresh.author;
			}

			return { ok: true };
		} catch (error) {
			loggers.warning(color('Settings reload failed:', 'red'), color(error.message, 'white'));

			return { ok: false, status: 500, message: 'Failed to reload settings.' };
		}
	}

	return { ok: false, message: 'Unsupported runtime sync action.' };
};

const sendConfirmationButton = async ({ waClient, to, approveButtonId, rejectButtonId, phoneNumber }) => {
	if (!waClient) {
		throw new Error('WhatsApp client is not ready.');
	}

	const locale = await getLocale();
	const L = useLocale(locale, 'common');

	if (waClient.TemplateBuilder?.Native) {
		const builder = new waClient.TemplateBuilder.Native();

		await builder
			.destination(to)
			.body(L.core.dashboard.loginRequest)
			.footer(t(locale, 'common.core.dashboard.requestedNumber', [phoneNumber]))
			.buttons(
				builder.button.reply({ display: L.core.success.confirmLogin, id: approveButtonId }),
				builder.button.reply({ display: L.core.success.rejectLogin, id: rejectButtonId })
			)
			.send();

		return;
	}

	await waClient.send(to, {
		text: t(locale, 'common.core.dashboard.loginDetected', [approveButtonId, rejectButtonId])
	});
};

export const startDashboardBridge = (resolveWaClient) => {
	if (process.env.SUB_BOT_PROCESS === '1') {
		return;
	}

	if (instance) {
		return;
	}

	const app = express();

	app.use(express.json());

	app.post('/internal/dashboard/send-confirmation', async (req, res) => {
		const token = String(req.headers['x-dashboard-bridge-token'] || '');

		if (!token || token !== DASHBOARD_BRIDGE_TOKEN) {
			return res.status(401).json({ ok: false, message: 'Unauthorized bridge token.' });
		}

		const { to, approveButtonId, rejectButtonId, phoneNumber } = req.body || {};

		if (!to || !approveButtonId || !rejectButtonId || !phoneNumber) {
			return res.status(400).json({ ok: false, message: 'Invalid bridge payload.' });
		}

		const waClient = typeof resolveWaClient === 'function' ? resolveWaClient() : null;

		if (!waClient?.send) {
			return res.status(503).json({ ok: false, message: 'WhatsApp client is not connected yet.' });
		}

		try {
			await sendConfirmationButton({ waClient, to, approveButtonId, rejectButtonId, phoneNumber });

			return res.json({ ok: true });
		} catch (error) {
			loggers.warning(color('Dashboard bridge send failed:', 'red'), color(error.message, 'white'));

			return res.status(500).json({ ok: false, message: 'Failed sending WhatsApp confirmation.' });
		}
	});

	app.post('/internal/dashboard/runtime-sync', async (req, res) => {
		const token = String(req.headers['x-dashboard-bridge-token'] || '');

		if (!token || token !== DASHBOARD_BRIDGE_TOKEN) {
			return res.status(401).json({ ok: false, message: 'Unauthorized bridge token.' });
		}

		const type = String(req.body?.type || '').trim();
		const payload = req.body?.payload && typeof req.body.payload === 'object' ? req.body.payload : {};
		const waClient = typeof resolveWaClient === 'function' ? resolveWaClient() : null;

		try {
			const result = await applyRuntimeMutation(waClient, type, payload);

			if (!result?.ok) {
				return res.status(result?.status || 400).json(result);
			}

			return res.json(result);
		} catch (error) {
			loggers.warning(color('Dashboard runtime sync failed:', 'red'), color(error.message, 'white'));

			return res.status(500).json({ ok: false, message: 'Runtime sync failed.' });
		}
	});

	app.get('/internal/dashboard/logs', (req, res) => {
		const token = String(req.headers['x-dashboard-bridge-token'] || '');

		if (!token || token !== DASHBOARD_BRIDGE_TOKEN) {
			return res.status(401).json({ ok: false, message: 'Unauthorized bridge token.' });
		}

		return res.json(getDashboardLogs({ since: Number(req.query?.since || 0), limit: Number(req.query?.limit || 200) }));
	});

	app.post('/internal/dashboard/restart', (req, res) => {
		const token = String(req.headers['x-dashboard-bridge-token'] || '');

		if (!token || token !== DASHBOARD_BRIDGE_TOKEN) {
			return res.status(401).json({ ok: false, message: 'Unauthorized bridge token.' });
		}

		if (!process.env.pm_id && !process.env.PM2_HOME) {
			return res.status(409).json({ ok: false, message: 'Restart is only supported when the bot is managed by PM2.' });
		}

		res.json({ ok: true, restarting: true });
		setTimeout(() => process.exit(0), 220);
	});

	app.get('/internal/dashboard/messages', (req, res) => {
		const token = String(req.headers['x-dashboard-bridge-token'] || '');

		if (!token || token !== DASHBOARD_BRIDGE_TOKEN) {
			return res.status(401).json({ ok: false, message: 'Unauthorized bridge token.' });
		}

		const waClient = typeof resolveWaClient === 'function' ? resolveWaClient() : null;

		if (!waClient?.store) {
			return res.status(503).json({ ok: false, message: 'Store not available.' });
		}

		const query = String(req.query?.q || '')
			.trim()
			.toLowerCase();
		const jidFilter = String(req.query?.jid || '').trim();
		const limit = Number(req.query?.limit) || 0;
		const messages = waClient.store.messages || {};
		const results = [];

		for (const [jid, list] of Object.entries(messages)) {
			if (jidFilter && !jid.includes(jidFilter)) {
				continue;
			}

			const arr = list?.array || (typeof list?.toJSON === 'function' ? list.toJSON() : []);

			for (let i = arr.length - 1; i >= 0; i--) {
				if (limit && results.length >= limit) {
					break;
				}

				const msg = arr[i];
				const content = extractMessageText(msg);

				if (query && !content.toLowerCase().includes(query)) {
					continue;
				}

				results.push({
					id: msg.key?.id,
					jid,
					sender: resolveMessageSender(msg, jid),
					fromMe: Boolean(msg.key?.fromMe),
					timestamp: Number(msg.messageTimestamp || 0),
					content,
					type: msg.message
						? Object.keys(msg.message).find((k) => k !== 'messageContextInfo' && k !== 'senderKeyDistributionMessage') ||
							'unknown'
						: 'empty'
				});
			}

			if (limit && results.length >= limit) {
				break;
			}
		}

		results.sort((a, b) => b.timestamp - a.timestamp);

		res.json({ count: results.length, messages: limit ? results.slice(0, limit) : results });
	});

	app.get('/internal/dashboard/group-info', async (req, res) => {
		const token = String(req.headers['x-dashboard-bridge-token'] || '');

		if (!token || token !== DASHBOARD_BRIDGE_TOKEN) {
			return res.status(401).json({ ok: false, message: 'Unauthorized bridge token.' });
		}

		const waClient = typeof resolveWaClient === 'function' ? resolveWaClient() : null;

		if (!waClient?.groupFetchAllParticipating) {
			return res.status(503).json({ ok: false, message: 'WhatsApp client not connected.' });
		}

		const groupId = String(req.query?.groupId || '').trim();

		if (!groupId) {
			return res.status(400).json({ ok: false, message: 'groupId is required.' });
		}

		try {
			const participating = await waClient.groupFetchAllParticipating();
			const meta = participating?.[groupId];

			if (!meta) {
				return res.status(404).json({ ok: false, message: 'Group not found.' });
			}

			const ownerNumber = String(configuration.settings?.owner_number || '');
			const localContacts = waClient.store?.localContacts || {};
			const storeContacts = waClient.store?.contacts || {};
			const userCache = configuration.users?.info;
			const botPhone = configuration.botJid?.split('@')[0] || waClient.socket?.user?.id?.split(':')[0] || '';

			const participants = (meta.participants || []).map((p) => {
				const phone = String(p.phoneNumber || '').split('@')[0];
				const phoneJid = `${phone}@s.whatsapp.net`;
				const name =
					p.name ||
					p.notify ||
					p.verifiedName ||
					userCache?.get?.(phoneJid)?.name ||
					localContacts[phoneJid]?.name ||
					storeContacts[p.id]?.notify ||
					'';

				return {
					id: p.id,
					phone,
					name,
					admin: p.admin || null,
					isGroupOwner: p.admin === 'superadmin',
					isBotOwner: phone === ownerNumber,
					isBot: phone === botPhone
				};
			});

			const isBotAdmin = participants.some((p) => p.phone === botPhone && (p.admin === 'admin' || p.admin === 'superadmin'));

			res.json({
				ok: true,
				jid: groupId,
				subject: meta.subject || '',
				desc: meta.desc || '',
				owner: meta.owner || '',
				size: participants.length,
				isBotAdmin,
				participants
			});
		} catch (error) {
			res.status(500).json({ ok: false, message: error?.message || 'Failed to fetch group info.' });
		}
	});

	app.get('/internal/dashboard/participating', async (req, res) => {
		const token = String(req.headers['x-dashboard-bridge-token'] || '');

		if (!token || token !== DASHBOARD_BRIDGE_TOKEN) {
			return res.status(401).json({ ok: false, message: 'Unauthorized bridge token.' });
		}

		const waClient = typeof resolveWaClient === 'function' ? resolveWaClient() : null;

		if (!waClient?.groupFetchAllParticipating) {
			return res.status(503).json({ ok: false, message: 'WhatsApp client not connected.' });
		}

		try {
			const participating = await waClient.groupFetchAllParticipating();

			res.json({ ok: true, data: participating });
		} catch (error) {
			res.status(500).json({ ok: false, message: error?.message || 'Failed to fetch participating groups.' });
		}
	});

	app.get('/internal/dashboard/subbots', async (req, res) => {
		const token = String(req.headers['x-dashboard-bridge-token'] || '');

		if (!token || token !== DASHBOARD_BRIDGE_TOKEN) {
			return res.status(401).json({ ok: false, message: 'Unauthorized bridge token.' });
		}

		try {
			const rows = await prisma.botInstance.findMany({ orderBy: { createdAt: 'asc' } });
			const pm2Statuses = await getPm2SubBotStatuses();
			const subBots = rows.map((row) => {
				const inMemory = manager.get(row.sessionName);
				const flags = JSON.parse(row.flags || '{}');
				const pm2 = pm2Statuses.get(row.sessionName);

				return {
					id: row.id,
					sessionName: row.sessionName,
					flags,
					role: row.role,
					pairNumber: row.pairNumber,
					isActive: row.isActive,
					connected: Boolean(inMemory?.state === 'connected' || pm2?.running),
					phone: inMemory?.phone || null,
					createdAt: row.createdAt,
					updatedAt: row.updatedAt
				};
			});

			res.json({ ok: true, subBots });
		} catch (error) {
			res.status(500).json({ ok: false, message: error?.message || 'Failed to list sub-bots.' });
		}
	});

	app.post('/internal/dashboard/subbots/:name/start', async (req, res) => {
		const token = String(req.headers['x-dashboard-bridge-token'] || '');

		if (!token || token !== DASHBOARD_BRIDGE_TOKEN) {
			return res.status(401).json({ ok: false, message: 'Unauthorized bridge token.' });
		}

		const name = String(req.params.name || '').trim();

		if (!name) {
			return res.status(400).json({ ok: false, message: 'Sub-bot name is required.' });
		}

		try {
			const row = await prisma.botInstance.findUnique({ where: { sessionName: name } });

			if (!row) {
				return res.status(404).json({ ok: false, message: `Sub-bot "${name}" not found.` });
			}

			await prisma.botInstance.update({ where: { sessionName: name }, data: { isActive: true } });
			await startPm2SubBot(name);

			res.json({ ok: true, sessionName: name });
		} catch (error) {
			res.status(500).json({ ok: false, message: error?.message || 'Failed to start sub-bot.' });
		}
	});

	app.post('/internal/dashboard/subbots/:name/stop', async (req, res) => {
		const token = String(req.headers['x-dashboard-bridge-token'] || '');

		if (!token || token !== DASHBOARD_BRIDGE_TOKEN) {
			return res.status(401).json({ ok: false, message: 'Unauthorized bridge token.' });
		}

		const name = String(req.params.name || '').trim();

		if (!name) {
			return res.status(400).json({ ok: false, message: 'Sub-bot name is required.' });
		}

		try {
			const row = await prisma.botInstance.findUnique({ where: { sessionName: name } });

			if (!row) {
				return res.status(404).json({ ok: false, message: `Sub-bot "${name}" not found.` });
			}

			manager.remove(name);
			await stopPm2SubBot(name);

			res.json({ ok: true, sessionName: name });
		} catch (error) {
			res.status(500).json({ ok: false, message: error?.message || 'Failed to stop sub-bot.' });
		}
	});

	app.patch('/internal/dashboard/subbots/:name/flags', async (req, res) => {
		const token = String(req.headers['x-dashboard-bridge-token'] || '');

		if (!token || token !== DASHBOARD_BRIDGE_TOKEN) {
			return res.status(401).json({ ok: false, message: 'Unauthorized bridge token.' });
		}

		const name = String(req.params.name || '').trim();

		if (!name) {
			return res.status(400).json({ ok: false, message: 'Sub-bot name is required.' });
		}

		const flags = req.body?.flags;

		if (!flags || typeof flags !== 'object') {
			return res.status(400).json({ ok: false, message: 'Flags object is required.' });
		}

		try {
			const row = await prisma.botInstance.findUnique({ where: { sessionName: name } });

			if (!row) {
				return res.status(404).json({ ok: false, message: `Sub-bot "${name}" not found.` });
			}

			await prisma.botInstance.update({
				where: { sessionName: name },
				data: { flags: JSON.stringify(flags) }
			});

			res.json({ ok: true, sessionName: name, flags });
		} catch (error) {
			res.status(500).json({ ok: false, message: error?.message || 'Failed to update flags.' });
		}
	});

	app.delete('/internal/dashboard/subbots/:name', async (req, res) => {
		const token = String(req.headers['x-dashboard-bridge-token'] || '');

		if (!token || token !== DASHBOARD_BRIDGE_TOKEN) {
			return res.status(401).json({ ok: false, message: 'Unauthorized bridge token.' });
		}

		const name = String(req.params.name || '').trim();
		const purge = req.query?.purge === '1' || req.query?.purge === 'true';

		if (!name) {
			return res.status(400).json({ ok: false, message: 'Sub-bot name is required.' });
		}

		try {
			const row = await prisma.botInstance.findUnique({ where: { sessionName: name } });

			if (!row) {
				return res.status(404).json({ ok: false, message: `Sub-bot "${name}" not found.` });
			}

			manager.remove(name);
			await stopPm2SubBot(name).catch(() => {});

			if (purge) {
				await prisma.botInstance.delete({ where: { sessionName: name } });
			} else {
				await prisma.botInstance.update({ where: { sessionName: name }, data: { isActive: false } });
			}

			res.json({ ok: true, sessionName: name, purged: purge });
		} catch (error) {
			res.status(500).json({ ok: false, message: error?.message || 'Failed to remove sub-bot.' });
		}
	});

	app.get('/internal/dashboard/subbots/:name/logs', async (req, res) => {
		const token = String(req.headers['x-dashboard-bridge-token'] || '');

		if (!token || token !== DASHBOARD_BRIDGE_TOKEN) {
			return res.status(401).json({ ok: false, message: 'Unauthorized bridge token.' });
		}

		const name = String(req.params.name || '').trim();

		if (!name) {
			return res.status(400).json({ ok: false, message: 'Sub-bot name is required.' });
		}

		const since = Number(req.query?.since) || 0;
		const limit = Number(req.query?.limit) || 200;

		const result = await getPm2SubBotLogs(name, { since, limit });

		res.json(result);
	});

	app.get('/internal/dashboard/ping', (req, res) => {
		const token = String(req.headers['x-dashboard-bridge-token'] || '');

		if (!token || token !== DASHBOARD_BRIDGE_TOKEN) {
			return res.status(401).json({ ok: false, message: 'Unauthorized bridge token.' });
		}

		const waClient = typeof resolveWaClient === 'function' ? resolveWaClient() : null;

		return res.json({
			ok: true,
			online: true,
			waConnected: Boolean(waClient?.send),
			pid: process.pid,
			uptimeSeconds: Math.floor(process.uptime())
		});
	});

	const port = Number.isFinite(DASHBOARD_BRIDGE_PORT) && DASHBOARD_BRIDGE_PORT > 0 ? DASHBOARD_BRIDGE_PORT : 4010;

	instance = createServer(app).listen(port, '127.0.0.1', () => {
		loggers.info(color('Dashboard bridge', 'white'), color('listening on', 'lilac'), color(String(port), 'white'));

		if (configuration.dashboard?.expressInstances) {
			configuration.dashboard.expressInstances.set('dashboard-bridge', instance);
		}
	});
};

function resolveMessageSender(msg, jid) {
	const participant = msg.key?.participant;

	if (participant?.endsWith('@lid')) {
		return msg.key?.participantAlt || participant;
	}

	return participant || msg.key?.remoteJidAlt || msg.key?.remoteJid || jid;
}

function extractMessageText(msg) {
	const m = msg?.message;

	if (!m) {
		return '';
	}

	return (
		m.conversation ||
		m.extendedTextMessage?.text ||
		m.imageMessage?.caption ||
		m.videoMessage?.caption ||
		m.documentWithCaptionMessage?.message?.documentMessage?.caption ||
		m.listResponseMessage?.singleSelectReply?.selectedRowId ||
		m.buttonsResponseMessage?.selectedButtonId ||
		m.templateButtonReplyMessage?.selectedId ||
		''
	);
}
