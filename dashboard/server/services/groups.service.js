import {
	getAllGroupSettings,
	getGroupSettings,
	updateGroupSetting
} from '../../../src/helper/database/adapters/group-settings.js';
import prisma from '../../../src/helper/database/prisma.js';
import { getEmbeddedWaClient, isBotEmbeddedHere } from '../lib/client.js';

const TOGGLE_FIELDS = [
	'welcome', 'leave', 'welcomeImage',
	'antiDelete', 'antiGroupURL', 'antiURL', 'antiSpam',
	'antiVirus', 'autoReader', 'antiNSFW', 'games', 'notification'
];

const MESSAGE_FIELDS = ['welcomeMessage', 'leaveMessage'];
const VALID_FIELDS = new Set([...TOGGLE_FIELDS, ...MESSAGE_FIELDS]);

function getGroupMetadataCache(configuration) {
	return configuration?.groups?.metadata;
}

function buildGroupEntry(metadata, settings) {
	return {
		jid: metadata?.id || settings?.groupId || '',
		subject: metadata?.subject || settings?.groupName || '',
		description: metadata?.desc || settings?.groupDescription || '',
		size: metadata?.participantsGroup?.length || metadata?.participants?.length || 0,
		settings: settings ? formatSettings(settings) : null
	};
}

function formatSettings(raw) {
	const result = {};

	for (const field of TOGGLE_FIELDS) {
		result[field] = raw[field] === 'enable';
	}

	for (const field of MESSAGE_FIELDS) {
		result[field] = String(raw[field] || '');
	}

	result.bannedMembers = Array.isArray(raw.banned) ? raw.banned : [];

	return result;
}

export function createGroupsService({ configuration, botBridge } = {}) {
	if (!configuration) {
		throw new Error('groups.service: configuration is required');
	}

	async function fetchParticipating() {
		const client = getEmbeddedWaClient();

		if (client) {
			return client.groupFetchAllParticipating();
		}

		if (!botBridge?.isConfigured) {
			return {};
		}

		const result = await botBridge.fetchParticipating();

		return result.ok ? (result.data?.data || {}) : {};
	}

	async function getGroupsForAdmin(phoneNumber) {
		if (!phoneNumber) {
			return [];
		}

		const participating = await fetchParticipating();
		const adminGroups = [];

		for (const [groupId, meta] of Object.entries(participating)) {
			const isAdmin = meta.participants?.some(
				(p) => {
					const pPhone = String(p.phoneNumber || '').split('@')[0];

					return pPhone === phoneNumber && (p.admin === 'admin' || p.admin === 'superadmin');
				}
			);

			if (isAdmin) {
				const settings = await getGroupSettings(prisma, groupId);

				adminGroups.push(buildGroupEntry(meta, settings));
			}
		}

		return adminGroups;
	}

	function isAdminOf(phoneNumber, groupId, participating) {
		if (!phoneNumber || !groupId || !participating?.[groupId]) {
			return false;
		}

		const meta = participating[groupId];

		return meta.participants?.some(
			(p) => {
				const pPhone = String(p.phoneNumber || '').split('@')[0];

				return pPhone === phoneNumber && (p.admin === 'admin' || p.admin === 'superadmin');
			}
		) || false;
	}

	async function list() {
		const allSettings = await getAllGroupSettings(prisma);
		const cache = getGroupMetadataCache(configuration);
		const groups = [];
		const seen = new Set();

		if (cache && isBotEmbeddedHere()) {
			const entries = typeof cache.entries === 'function' ? cache.entries() : [];

			for (const [jid, metadata] of entries) {
				seen.add(jid);

				const settings = allSettings.find((s) => s.groupId === jid) || null;

				groups.push(buildGroupEntry(metadata, settings));
			}
		}

		for (const settings of allSettings) {
			if (!seen.has(settings.groupId)) {
				groups.push(buildGroupEntry(null, settings));
			}
		}

		return groups.sort((a, b) => a.subject.localeCompare(b.subject));
	}

	async function getSettings(groupId) {
		const raw = await getGroupSettings(prisma, groupId);

		if (!raw) {
			return null;
		}

		return formatSettings(raw);
	}

	function updateCache(groupId, field, dbValue) {
		const cached = configuration?.groups?.settings?.get?.(groupId);

		if (cached) {
			cached[field] = dbValue;
		}
	}

	async function updateSetting(groupId, field, value) {
		if (!VALID_FIELDS.has(field)) {
			return { ok: false, message: `Invalid field: ${field}` };
		}

		if (TOGGLE_FIELDS.includes(field)) {
			const dbValue = Boolean(value) ? 'enable' : 'disable';

			await updateGroupSetting(prisma, groupId, field, dbValue);
			updateCache(groupId, field, dbValue);

			return { ok: true, field, value: Boolean(value) };
		}

		if (MESSAGE_FIELDS.includes(field)) {
			const dbValue = String(value || '');

			await updateGroupSetting(prisma, groupId, field, dbValue);
			updateCache(groupId, field, dbValue);

			return { ok: true, field, value: dbValue };
		}

		return { ok: false, message: 'Unknown field type.' };
	}

	return {
		list,
		getSettings,
		updateSetting,
		fetchParticipating,
		getGroupsForAdmin,
		isAdminOf,
		TOGGLE_FIELDS,
		MESSAGE_FIELDS
	};
}
