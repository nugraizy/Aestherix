import express from 'express';
import { createServer } from 'http';

import {
	getDashboardLogs,
	setDashboardCommandState,
	setDashboardFlagState
} from '../dashboard/monitor.js';
import configuration from '../../helper/config/connect.js';
import { banUser, getBannedUsers, getUserLimit, unbanUser, upsertUserLimit } from '../../helper/database/adapters/user.js';
import prisma from '../../helper/database/prisma.js';
import { color, loggers } from '../../utils/modules/index.js';

const DASHBOARD_BRIDGE_PORT = Number(process.env.DASHBOARD_BRIDGE_PORT || 4010);
const DASHBOARD_BRIDGE_TOKEN = String(process.env.DASHBOARD_BRIDGE_TOKEN || 'aestherix-local-bridge-token');
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

		configuration.cache.bannedlist = await getBannedUsers(prisma);

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

		const set = new Set(Array.isArray(configuration.cache?.blocklist) ? configuration.cache.blocklist : []);

		if (Boolean(payload.enabled)) {
			set.add(jid);
		} else {
			set.delete(jid);
		}

		configuration.cache.blocklist = Array.from(set);

		return { ok: true, userId: jid };
	}

	return { ok: false, message: 'Unsupported runtime sync action.' };
};

const sendConfirmationButton = async ({ waClient, to, approveButtonId, rejectButtonId, phoneNumber }) => {
	if (!waClient) {
		throw new Error('WhatsApp client is not ready.');
	}

	if (waClient.TemplateBuilder?.Native) {
		const builder = new waClient.TemplateBuilder.Native();

		await builder
			.destination(to)
			.body('A dashboard login request was made for your owner account. Confirm if this was you.')
			.footer(`Requested number: ${phoneNumber}`)
			.buttons(
				builder.button.reply({ display: 'Confirm Login', id: approveButtonId }),
				builder.button.reply({ display: 'Reject Login', id: rejectButtonId })
			)
			.send();

		return;
	}

	await waClient.send(to, { text: `Dashboard login request detected.\n\nReply one of these codes:\nConfirm: ${approveButtonId}\nReject: ${rejectButtonId}` });
};

export const startDashboardBridge = (resolveWaClient) => {
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

	const port = Number.isFinite(DASHBOARD_BRIDGE_PORT) && DASHBOARD_BRIDGE_PORT > 0 ? DASHBOARD_BRIDGE_PORT : 4010;

	instance = createServer(app).listen(port, '127.0.0.1', () => {
		loggers.info(color('Dashboard bridge', 'white'), color('listening on', 'lilac'), color(String(port), 'white'));
	});
};
