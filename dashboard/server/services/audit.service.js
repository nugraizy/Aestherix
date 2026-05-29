import { appendAuditLog, getAuditLogs, getLastAuditLogId } from '../../../src/helper/database/adapters/dashboard.js';
import { color, loggers } from '../../../src/utils/modules/index.js';

const MAX_AUDIT_LOGS = 1000;

function normalizeStatus(status) {
	return status === 'failed' ? 'failed' : 'ok';
}

const ACTOR_ROLE_MAP = {
	superOwner: 'superOwner',
	owner: 'owner',
	viewer: 'viewer',
	groupAdmin: 'groupAdmin'
};

function buildEntry({ id, timestamp, action, session, target, status, message, before, after }) {
	const actorRole = ACTOR_ROLE_MAP[session?.role] || 'system';
	const actor = session?.phoneNumber || session?.name || null;

	return {
		id,
		timestamp,
		action: String(action || 'unknown'),
		actorRole,
		actor,
		target: target ? String(target) : null,
		status: normalizeStatus(status),
		message: message ? String(message) : null,
		before: before ?? null,
		after: after ?? null
	};
}

export function createAuditService({ prisma } = {}) {
	if (!prisma) {
		throw new Error('audit.service: prisma is required');
	}

	const state = { logs: [], lastId: 0 };

	async function load() {
		try {
			const rows = await getAuditLogs(prisma, MAX_AUDIT_LOGS);

			state.logs = rows
				.map((entry) => ({
					id: Number(entry?.id || 0),
					timestamp: Number(entry?.timestamp || 0),
					action: String(entry?.action || 'unknown'),
					actorRole: String(entry?.actorRole || 'unknown'),
					actor: entry?.actor ? String(entry.actor) : null,
					target: entry?.target ? String(entry.target) : null,
					status: normalizeStatus(entry?.status),
					message: entry?.message ? String(entry.message) : null,
					before: entry?.before ?? null,
					after: entry?.after ?? null
				}))
				.filter((entry) => entry.id > 0)
				.slice(-MAX_AUDIT_LOGS);
			state.lastId = await getLastAuditLogId(prisma);
		} catch (error) {
			loggers.warning(color('Failed loading dashboard audit logs:', 'red'), color(error.message, 'white'));
		}
	}

	function push({ action, session = null, target = null, status = 'ok', message = null, before = null, after = null } = {}) {
		state.lastId += 1;

		const entry = buildEntry({
			id: state.lastId,
			timestamp: Date.now(),
			action,
			session,
			target,
			status,
			message,
			before,
			after
		});

		state.logs.push(entry);

		if (state.logs.length > MAX_AUDIT_LOGS) {
			state.logs.splice(0, state.logs.length - MAX_AUDIT_LOGS);
		}

		void appendAuditLog(prisma, entry, state.lastId).catch(() => {});

		return entry;
	}

	function list({ since = 0, limit = 200, action = '', role = '', query = '' } = {}) {
		const safeSince = Number(since) || 0;
		const safeLimit = Math.max(1, Math.min(500, Number(limit) || 200));
		const actionFilters = String(action || '')
			.split(',')
			.map((value) => value.trim().toLowerCase())
			.filter(Boolean);
		const roleFilters = String(role || '')
			.split(',')
			.map((value) => value.trim().toLowerCase())
			.filter(Boolean);
		const queryFilter = String(query || '')
			.trim()
			.toLowerCase();

		const filtered = state.logs.filter((entry) => {
			if (entry.id <= safeSince) {
				return false;
			}

			if (actionFilters.length && !actionFilters.some((value) => entry.action.toLowerCase().includes(value))) {
				return false;
			}

			if (roleFilters.length && !roleFilters.includes(entry.actorRole.toLowerCase())) {
				return false;
			}

			if (!queryFilter) {
				return true;
			}

			const haystack = [entry.action, entry.actorRole, entry.actor || '', entry.target || '', entry.message || '']
				.join(' ')
				.toLowerCase();

			return haystack.includes(queryFilter);
		});

		return {
			lastId: state.lastId,
			logs: filtered.slice(-safeLimit)
		};
	}

	function sanitizeRealtimeFilters(value) {
		const safe = value && typeof value === 'object' ? value : {};

		return {
			action: String(safe.action || ''),
			role: String(safe.role || ''),
			query: String(safe.query || ''),
			limit: Math.max(1, Math.min(500, Number(safe.limit || 300) || 300))
		};
	}

	function purge() {
		state.logs = [];
		state.lastId = 0;
	}

	return { load, push, list, purge, sanitizeRealtimeFilters, MAX_AUDIT_LOGS };
}
