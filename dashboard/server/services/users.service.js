import {
	addToBlocklist,
	getDashboardBlocklist,
	removeFromBlocklist
} from '../../../src/helper/database/adapters/dashboard.js';
import {
	banUser,
	getAllUserLimits,
	getBannedUsers,
	getUserLimit,
	unbanUser,
	upsertUserLimit
} from '../../../src/helper/database/adapters/user.js';
import { color, loggers } from '../../../src/utils/modules/index.js';
import { getEmbeddedWaClient } from '../lib/client.js';

const S_WHATSAPP_NET = '@s.whatsapp.net';

function normalizePersistedUserJid(input) {
	let raw = String(input || '').trim();

	try {
		raw = decodeURIComponent(raw);
	} catch {
		// keep raw as-is when decode fails
	}

	raw = raw.replace(/\.json$/i, '');

	if (raw.endsWith('@c.us')) {
		raw = raw.replace(/@c\.us$/i, S_WHATSAPP_NET);
	}

	if (raw.endsWith(S_WHATSAPP_NET)) {
		return raw;
	}

	if (raw.includes('@')) {
		const localPart = raw.split('@')[0].replace(/\D/g, '');

		if (!localPart) {
			return null;
		}

		return `${localPart}${S_WHATSAPP_NET}`;
	}

	const digits = raw.replace(/\D/g, '');

	if (!digits) {
		return null;
	}

	return `${digits}${S_WHATSAPP_NET}`;
}

function redactUserIdMiddle(rawId) {
	const safeId = String(rawId || '').trim();

	if (!safeId) {
		return safeId;
	}

	const [localPart, domainPart] = safeId.split('@');
	const local = String(localPart || '');

	if (local.length <= 6) {
		return domainPart ? `${local}@${domainPart}` : local;
	}

	const prefix = local.slice(0, 3);
	const suffix = local.slice(-3);
	const middle = '*'.repeat(Math.max(1, local.length - 6));
	const masked = `${prefix}${middle}${suffix}`;

	return domainPart ? `${masked}@${domainPart}` : masked;
}

function defaultLimitState(jid) {
	return { id: jid, limit: 30, role: 'FREE' };
}

export function createUsersService({ configuration, prisma } = {}) {
	if (!configuration) {
		throw new Error('users.service: configuration is required');
	}

	if (!prisma) {
		throw new Error('users.service: prisma is required');
	}

	const normalizeUserJid = normalizePersistedUserJid;

	async function readBannedUsers() {
		return getBannedUsers(prisma);
	}

	async function writeBannedUsers(list) {
		const current = await getBannedUsers(prisma);
		const currentSet = new Set(current);
		const newSet = new Set(Array.from(new Set(list)));

		for (const jid of newSet) {
			if (!currentSet.has(jid)) {
				await banUser(prisma, jid).catch(() => {});
			}
		}

		for (const jid of currentSet) {
			if (!newSet.has(jid)) {
				await unbanUser(prisma, jid).catch(() => {});
			}
		}
	}

	async function readState(jid) {
		const raw = await getUserLimit(prisma, jid);

		if (!raw) {
			return defaultLimitState(jid);
		}

		return {
			id: normalizeUserJid(raw?.id) || jid,
			limit: Math.max(0, Number(raw?.limit || 0)),
			role: raw?.role === 'PREMIUM' ? 'PREMIUM' : 'FREE'
		};
	}

	async function writeState(jid, data) {
		const next = {
			id: jid,
			limit: Math.max(0, Number(data?.limit || 0)),
			role: data?.role === 'PREMIUM' ? 'PREMIUM' : 'FREE'
		};

		await upsertUserLimit(prisma, jid, next.limit, next.role);
		configuration.userLimit?.set?.(jid, { limit: next.limit, role: next.role });

		return next;
	}

	async function loadBlocklist() {
		try {
			const list = await getDashboardBlocklist(prisma);

			configuration.blocklist = list.map((jid) => normalizeUserJid(jid)).filter(Boolean);
		} catch (error) {
			loggers.warning(color('Failed loading dashboard blocklist:', 'red'), color(error.message, 'white'));
			configuration.blocklist = Array.isArray(configuration.blocklist) ? configuration.blocklist : [];
		}
	}

	async function persistBlocklist(addedJids = [], removedJids = []) {
		try {
			for (const jid of removedJids) {
				if (jid) {
					await removeFromBlocklist(prisma, jid).catch(() => {});
				}
			}

			for (const jid of addedJids) {
				if (jid) {
					await addToBlocklist(prisma, jid).catch(() => {});
				}
			}
		} catch (error) {
			loggers.warning(color('Failed persisting dashboard blocklist:', 'red'), color(error.message, 'white'));
		}
	}

	async function list({ redactNumbers = false } = {}) {
		const allUsers = await getAllUserLimits(prisma);
		const bannedUsers = await readBannedUsers();
		const bannedSet = new Set(bannedUsers);
		const blockSet = new Set(Array.isArray(configuration.blocklist) ? configuration.blocklist : []);

		return allUsers
			.map(({ id, limit, role }) => {
				const normalizedId = normalizeUserJid(id);

				if (!normalizedId) {
					return null;
				}

				return {
					id: redactNumbers ? redactUserIdMiddle(normalizedId) : normalizedId,
					limit,
					role,
					premium: role === 'PREMIUM',
					banned: bannedSet.has(normalizedId),
					blocked: blockSet.has(normalizedId)
				};
			})
			.filter(Boolean)
			.sort((a, b) => a.id.localeCompare(b.id));
	}

	async function setLimit(userId, limit) {
		const jid = normalizeUserJid(userId);

		if (!jid) {
			return { ok: false, message: 'Invalid user id.' };
		}

		const current = await readState(jid);
		const next = await writeState(jid, { ...current, limit: Math.max(0, Number(limit || 0)) });

		return { ok: true, user: next };
	}

	async function setPremium(userId, enabled) {
		const jid = normalizeUserJid(userId);

		if (!jid) {
			return { ok: false, message: 'Invalid user id.' };
		}

		const current = await readState(jid);
		const next = await writeState(jid, { ...current, role: enabled ? 'PREMIUM' : 'FREE' });

		return { ok: true, user: next };
	}

	async function setBanned(userId, enabled) {
		const jid = normalizeUserJid(userId);

		if (!jid) {
			return { ok: false, message: 'Invalid user id.' };
		}

		const list = await readBannedUsers();
		const set = new Set(list);

		if (enabled) {
			set.add(jid);
		} else {
			set.delete(jid);
		}

		const next = Array.from(set);

		await writeBannedUsers(next);
		configuration.bannedlist = next;

		return { ok: true, userId: jid, banned: enabled };
	}

	async function setBlocked(userId, enabled) {
		const jid = normalizeUserJid(userId);

		if (!jid) {
			return { ok: false, message: 'Invalid user id.' };
		}

		const waClient = getEmbeddedWaClient();
		let liveApplied = false;

		if (waClient?.updateBlockStatus) {
			await waClient.updateBlockStatus(jid, enabled ? 'block' : 'unblock');
			liveApplied = true;
		}

		const current = Array.isArray(configuration.blocklist) ? [...configuration.blocklist] : [];
		const set = new Set(current);

		if (enabled) {
			set.add(jid);
		} else {
			set.delete(jid);
		}

		configuration.blocklist = Array.from(set);
		await persistBlocklist(enabled ? [jid] : [], enabled ? [] : [jid]);

		return {
			ok: true,
			userId: jid,
			blocked: enabled,
			liveApplied,
			pendingSync: !liveApplied
		};
	}

	return {
		load: loadBlocklist,
		list,
		readState,
		writeState,
		setLimit,
		setPremium,
		setBanned,
		setBlocked,
		getBannedList: readBannedUsers,
		normalizeUserJid,
		redactUserIdMiddle
	};
}
