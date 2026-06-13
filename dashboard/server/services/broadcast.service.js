import { getAllContacts } from '../../../src/helper/database/adapters/user.js';
import { Uploader } from '../../../src/utils/modules/index.js';
import { getEmbeddedWaClient } from '../lib/client.js';

const MAX_TARGETS = 50;
const DEFAULT_DELAY_MS = 1500;
const KV_TEMPLATES_KEY = 'broadcast_templates';

export function createBroadcastService({ configuration, botBridge, prisma } = {}) {
	if (!configuration) {
		throw new Error('broadcast.service: configuration is required');
	}

	let running = false;
	let lastResult = null;

	function getClient() {
		return getEmbeddedWaClient();
	}

	function isRunning() {
		return running;
	}

	function getLastResult() {
		return lastResult;
	}

	async function getContacts() {
		const client = getClient();
		const memContacts = client?.store?.localContacts || {};
		const dbContacts = await getAllContacts(prisma).catch(() => []);
		const merged = new Map();

		for (const [jid, data] of Object.entries(memContacts)) {
			if (jid.endsWith('@s.whatsapp.net')) {
				merged.set(jid, data?.name || jid.split('@')[0]);
			}
		}

		for (const c of dbContacts) {
			const jid = c.id || c.jid;

			if (jid?.endsWith('@s.whatsapp.net') && !merged.has(jid)) {
				merged.set(jid, c.name || jid.split('@')[0]);
			}
		}

		return Array.from(merged.entries())
			.map(([jid, name]) => ({ jid, name }))
			.sort((a, b) => a.name.localeCompare(b.name));
	}

	async function send({
		targets,
		message,
		header,
		buttons,
		mediaUrl,
		mediaBuffer,
		mediaType,
		mentionAll,
		delayMs = DEFAULT_DELAY_MS,
		dryRun = false
	}) {
		if (!Array.isArray(targets) || !targets.length) {
			return { ok: false, message: 'No targets provided.' };
		}

		if (targets.length > MAX_TARGETS) {
			return { ok: false, message: `Maximum ${MAX_TARGETS} targets per broadcast.` };
		}

		if (!message || typeof message !== 'string' || !message.trim()) {
			return { ok: false, message: 'Message cannot be empty.' };
		}

		const client = getClient();

		if (!client && !dryRun) {
			return { ok: false, status: 503, message: 'WhatsApp client is not connected.' };
		}

		const safeDelay = Math.max(500, Math.min(10000, Number(delayMs) || DEFAULT_DELAY_MS));
		const results = [];
		const hasButtons = Array.isArray(buttons) && buttons.length > 0;
		const hasMedia = Boolean((mediaUrl || mediaBuffer) && mediaType);

		running = true;

		try {
			for (let i = 0; i < targets.length; i++) {
				const jid = String(targets[i] || '').trim();

				if (!jid) {
					results.push({ jid, ok: false, reason: 'empty' });
					continue;
				}

				if (dryRun) {
					results.push({ jid, ok: true, dryRun: true });
					continue;
				}

				try {
					const bodyText = header ? `*${header.trim()}*\n\n${message.trim()}` : message.trim();
					const resolvedText = await applyPlaceholders(bodyText, jid);

					const mentions = mentionAll ? await getParticipants(jid) : [];

					if (hasButtons && client.TemplateBuilder?.Native) {
						const builder = new client.TemplateBuilder.Native();
						const btnArgs = [];

						for (const btn of buttons) {
							if (btn.type === 'url' && btn.url) {
								btnArgs.push(builder.button.url({ display: btn.label || 'Link', url: btn.url }));
							} else if (btn.label) {
								btnArgs.push(builder.button.reply({ display: btn.label, id: btn.id || btn.label }));
							}
						}

						const b = builder
							.destination(jid)
							.body(resolvedText)
							.buttons(...btnArgs);

						if (hasMedia) {
							const mediaSource = mediaBuffer || mediaUrl;

							b.header('', mediaSource);
						}

						if (mentions.length) {
							b.mentions(mentions);
						}

						await b.send();
					} else if (hasMedia) {
						const mediaSource = mediaBuffer || { url: mediaUrl };
						const content = { [mediaType]: mediaSource, caption: resolvedText, mentions };

						await client.send(jid, content);
					} else {
						await client.send(jid, { text: resolvedText, mentions });
					}

					results.push({ jid, ok: true });
				} catch (error) {
					results.push({ jid, ok: false, reason: error?.message || 'send failed' });
				}

				if (i < targets.length - 1) {
					await new Promise((resolve) => setTimeout(resolve, safeDelay));
				}
			}
		} finally {
			running = false;
		}

		const sent = results.filter((r) => r.ok).length;
		const failed = results.filter((r) => !r.ok).length;

		lastResult = { sent, failed, total: targets.length, dryRun, timestamp: Date.now() };

		return { ok: true, sent, failed, total: targets.length, dryRun, results };
	}

	async function resolveGroupMetadata(jid) {
		const cache = configuration?.groups?.metadata;
		let meta = cache?.get?.(jid);

		if (!meta && jid.endsWith('@g.us')) {
			const client = getClient();

			if (client?.groupMetadata) {
				try {
					meta = await client.groupMetadata(jid);

					if (meta && cache?.set) {
						cache.set(jid, meta);
					}
				} catch {
					meta = null;
				}
			}
		}

		return {
			groupName: meta?.subject || '',
			memberCount: String(meta?.participantsGroup?.length || meta?.participants?.length || 0)
		};
	}

	async function getParticipants(jid) {
		await resolveGroupMetadata(jid);
		const cache = configuration?.groups?.metadata;
		const cached = cache?.get?.(jid);

		return cached?.participantsGroup || cached?.participants?.map((p) => p.id) || [];
	}

	async function applyPlaceholders(text, jid) {
		const meta = await resolveGroupMetadata(jid);
		const now = new Date();

		return text
			.replace(/\{groupName\}/g, meta.groupName)
			.replace(/\{memberCount\}/g, meta.memberCount)
			.replace(/\{date\}/g, now.toLocaleDateString())
			.replace(/\{time\}/g, now.toLocaleTimeString())
			.replace(/\{jid\}/g, jid)
			.replace(/\{prefix\}/g, configuration.prefix?.default || '.')
			.replace(/\{botName\}/g, configuration.packname || 'Aestherix')
			.replace(/\{newline\}/g, '\n');
	}

	async function getTemplates() {
		if (!prisma) {
			return [];
		}

		const row = await prisma.dashboardKV
			.findUnique({
				where: { key_sessionName: { key: KV_TEMPLATES_KEY, sessionName: 'main' } }
			})
			.catch(() => null);

		return row?.value ? JSON.parse(row.value) : [];
	}

	async function saveTemplate(template) {
		if (!prisma || !template?.name) {
			return { ok: false, message: 'Invalid template.' };
		}

		const templates = await getTemplates();
		const existing = templates.findIndex((t) => t.name === template.name);

		if (existing >= 0) {
			templates[existing] = template;
		} else {
			templates.push(template);
		}

		await prisma.dashboardKV.upsert({
			where: { key_sessionName: { key: KV_TEMPLATES_KEY, sessionName: 'main' } },
			update: { value: JSON.stringify(templates) },
			create: { key: KV_TEMPLATES_KEY, sessionName: 'main', value: JSON.stringify(templates) }
		});

		return { ok: true, templates };
	}

	async function deleteTemplate(name) {
		if (!prisma || !name) {
			return { ok: false, message: 'Invalid template name.' };
		}

		const templates = await getTemplates();
		const filtered = templates.filter((t) => t.name !== name);

		await prisma.dashboardKV.upsert({
			where: { key_sessionName: { key: KV_TEMPLATES_KEY, sessionName: 'main' } },
			update: { value: JSON.stringify(filtered) },
			create: { key: KV_TEMPLATES_KEY, sessionName: 'main', value: JSON.stringify(filtered) }
		});

		return { ok: true, templates: filtered };
	}

	const scheduledJobs = [];

	function schedule(payload, sendAt) {
		const delay = sendAt - Date.now();

		if (delay < 1000) {
			return { ok: false, message: 'Scheduled time must be in the future.' };
		}

		const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
		const timer = setTimeout(async () => {
			const idx = scheduledJobs.findIndex((j) => j.id === id);

			if (idx >= 0) {
				scheduledJobs.splice(idx, 1);
			}

			await send(payload);
		}, delay);

		scheduledJobs.push({
			id,
			sendAt,
			targets: payload.targets?.length || 0,
			message: (payload.message || '').slice(0, 50),
			timer
		});

		return { ok: true, id, sendAt, delay };
	}

	function cancelSchedule(id) {
		const idx = scheduledJobs.findIndex((j) => j.id === id);

		if (idx < 0) {
			return { ok: false, message: 'Schedule not found.' };
		}

		clearTimeout(scheduledJobs[idx].timer);
		scheduledJobs.splice(idx, 1);

		return { ok: true };
	}

	function getScheduleInfo() {
		return scheduledJobs.map(({ id, sendAt, targets, message }) => ({ id, sendAt, targets, message }));
	}

	async function uploadMedia(buffer) {
		const uploader = new Uploader(buffer);

		try {
			const result = await uploader.catbox();

			return result.url;
		} catch {
			// catbox failed, try monochrome
		}

		try {
			const result = await uploader.monochrome();

			return result.url;
		} catch {
			// monochrome failed too
		}

		throw new Error('All upload services failed. Try using a media URL instead.');
	}

	return {
		send,
		isRunning,
		getLastResult,
		getContacts,
		getTemplates,
		saveTemplate,
		deleteTemplate,
		schedule,
		cancelSchedule,
		getScheduleInfo,
		uploadMedia,
		applyPlaceholders,
		MAX_TARGETS,
		DEFAULT_DELAY_MS
	};
}
