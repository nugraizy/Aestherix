import { Router } from 'express';
import { z } from 'zod';

import { color, loggers } from '../../../src/utils/modules/index.js';
import { validate } from '../middleware/validation.middleware.js';

const groupIdParams = z.object({ groupId: z.string().min(5) });
const updateSettingBody = z.object({
	field: z.string().min(1),
	value: z.union([z.boolean(), z.string()])
});

export function createGroupsRouter({ services, configuration }) {
	const { audit, groups, middleware } = services;
	const router = Router();

	router.get('/groups', middleware.requireOwnerAuth, async (_req, res) => {
		try {
			const list = await groups.list();

			res.json({ count: list.length, groups: list });
		} catch (error) {
			res.status(500).json({ ok: false, message: error?.message || 'Failed to list groups.' });
		}
	});

	router.get('/groups/mine', middleware.requireDashboardAuth, async (req, res) => {
		const session = req.dashboardSession || services.auth.getSessionFromRequest(req);

		if (!session?.phoneNumber) {
			return res.status(403).json({ ok: false, message: 'No phone number in session.' });
		}

		try {
			const list = await groups.getGroupsForAdmin(session.phoneNumber);

			res.json({ count: list.length, groups: list });
		} catch (error) {
			res.status(500).json({ ok: false, message: error?.message || 'Failed to list groups.' });
		}
	});

	router.get('/groups/:groupId/info', middleware.requireDashboardAuth, async (req, res) => {
		const groupId = decodeURIComponent(req.params.groupId);

		try {
			const client = (await import('../lib/client.js')).getEmbeddedWaClient();

			if (!client && services.botBridge?.isConfigured) {
				const result = await services.botBridge.fetchGroupInfo(groupId);

				if (!result.ok) {
					return res.status(result.status || 503).json({ ok: false, message: result.message || 'Failed to fetch group info.' });
				}

				const data = result.data;

				delete data.ok;

				return res.json(data);
			}

			const participating = await groups.fetchParticipating();
			const meta = participating?.[groupId];

			if (!meta) {
				return res.status(404).json({ ok: false, message: 'Group not found.' });
			}

			const ownerNumber = String(configuration.settings?.owner_number || '');
			const localContacts = client?.store?.localContacts || {};
			const storeContacts = client?.store?.contacts || {};
			const userCache = configuration.users?.info;
			const botPhone = configuration.botJid?.split('@')[0] || client?.socket?.user?.id?.split(':')[0] || '';

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

			const isBotAdmin = participants.some(
				(p) => p.phone === botPhone && (p.admin === 'admin' || p.admin === 'superadmin')
			);

			res.json({
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

	router.post('/groups/:groupId/participants', middleware.requireOwnerAuth, async (req, res) => {
		const groupId = decodeURIComponent(req.params.groupId);
		const { action, participants: jids } = req.body || {};

		if (!['remove', 'promote', 'demote'].includes(action) || !Array.isArray(jids) || !jids.length) {
			return res.status(400).json({ ok: false, message: 'Invalid action or participants.' });
		}

		const client = (await import('../lib/client.js')).getEmbeddedWaClient();

		if (!client) {
			return res.status(503).json({ ok: false, message: 'WhatsApp client not connected.' });
		}

		try {
			await client.groupParticipantsUpdate(groupId, jids, action);

			res.json({ ok: true, action, count: jids.length });
		} catch (error) {
			res.status(500).json({ ok: false, message: error?.message || 'Action failed.' });
		}
	});

	router.get('/groups/:groupId/settings', middleware.requireDashboardAuth, async (req, res) => {
		const session = req.dashboardSession || services.auth.getSessionFromRequest(req);
		const groupId = decodeURIComponent(req.params.groupId);

		const isOwner = session?.role === 'owner' || session?.role === 'superOwner';

		if (!isOwner && session?.role === 'groupAdmin') {
			const participating = await groups.fetchParticipating();

			if (!groups.isAdminOf(session.phoneNumber, groupId, participating)) {
				return res.status(403).json({ ok: false, message: 'You are not an admin of this group.' });
			}
		} else if (!isOwner) {
			return res.status(403).json({ ok: false, message: 'Permission denied.' });
		}

		const settings = await groups.getSettings(groupId);

		if (!settings) {
			return res.status(404).json({ ok: false, message: 'Group settings not found.' });
		}

		res.json({ groupId, settings });
	});

	router.patch(
		'/groups/:groupId/settings',
		middleware.requireDashboardAuth,
		validate({ params: groupIdParams, body: updateSettingBody }),
		async (req, res) => {
			const session = req.dashboardSession || services.auth.getSessionFromRequest(req);
			const groupId = decodeURIComponent(req.params.groupId);

			const isOwner = session?.role === 'owner' || session?.role === 'superOwner';

			if (!isOwner) {
				if (session?.role !== 'groupAdmin' || !session?.phoneNumber) {
					return res.status(403).json({ ok: false, message: 'Permission denied.' });
				}

				const participating = await groups.fetchParticipating();

				if (!groups.isAdminOf(session.phoneNumber, groupId, participating)) {
					return res.status(403).json({ ok: false, message: 'You are not an admin of this group.' });
				}
			}

			const { field, value } = req.body;
			const result = await groups.updateSetting(groupId, field, value);

			if (!result.ok) {
				audit.push({
					action: 'group.settings.update',
					session,
					target: groupId,
					status: 'failed',
					message: result.message
				});

				return res.status(400).json(result);
			}

			audit.push({
				action: 'group.settings.update',
				session,
				target: groupId,
				after: { [field]: result.value }
			});

			loggers.info(
				color('Dashboard updated group setting:', 'white'),
				color(groupId, 'lilac'),
				color(field, 'white'),
				color('⤑', 'gray'),
				color(String(result.value), 'green')
			);

			res.json({ ok: true, groupId, field: result.field, value: result.value });
		}
	);

	return router;
}
