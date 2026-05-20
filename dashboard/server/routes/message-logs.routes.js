import { Router } from 'express';

import { getEmbeddedWaClient } from '../lib/client.js';

export function createMessageLogsRouter({ services }) {
	const { middleware } = services;
	const router = Router();

	router.get('/messages', middleware.requireOwnerAuth, (req, res) => {
		const client = getEmbeddedWaClient();

		if (!client?.store) {
			return res.status(503).json({ ok: false, message: 'Store not available.' });
		}

		const query = String(req.query?.q || '').trim().toLowerCase();
		const jidFilter = String(req.query?.jid || '').trim();
		const limit = Number(req.query?.limit) || 0;
		const messages = client.store.messages || {};
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
				const content = extractText(msg);

				if (query && !content.toLowerCase().includes(query)) {
					continue;
				}

				results.push({
					id: msg.key?.id,
					jid,
					sender: resolveSender(msg, jid),
					fromMe: Boolean(msg.key?.fromMe),
					timestamp: Number(msg.messageTimestamp || 0),
					content,
					type: msg.message ? Object.keys(msg.message).find((k) => k !== 'messageContextInfo' && k !== 'senderKeyDistributionMessage') || 'unknown' : 'empty'
				});
			}

			if (limit && results.length >= limit) {
				break;
			}
		}

		results.sort((a, b) => b.timestamp - a.timestamp);

		res.json({ count: results.length, messages: limit ? results.slice(0, limit) : results });
	});

	return router;
}

function resolveSender(msg, jid) {
	const participant = msg.key?.participant;

	if (participant?.endsWith('@lid')) {
		return msg.key?.participantAlt || participant;
	}

	return participant || msg.key?.remoteJidAlt || msg.key?.remoteJid || jid;
}

function extractText(msg) {
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
