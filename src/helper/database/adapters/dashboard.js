/**
 * Dashboard adapter — drop-in replacement for the JSON file operations in
 * src/helper/connection/dashboard/server.js.
 *
 * Covers: sessions, audit logs, blocklist, and OTPs.
 *
 * @module database/adapters/dashboard
 */

/** @typedef {import('@prisma/client').PrismaClient} PrismaClient */

// ─────────────────────────────────────────────────────────────────────────────
// Sessions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} DashboardSessionData
 * @property {string}      token
 * @property {string}      role
 * @property {string|null} phoneNumber
 * @property {string|null} name
 * @property {number|null} lastSeenAt
 * @property {number|null} expiresAt
 */

/** @param {import('@prisma/client').DashboardSession} row */
const sessionRowToData = (row) => ({
	token: row.token,
	role: row.role,
	phoneNumber: row.phoneNumber ?? null,
	name: row.name ?? null,
	lastSeenAt: row.lastSeenAt !== null ? Number(row.lastSeenAt) : null,
	expiresAt: row.expiresAt !== null ? Number(row.expiresAt) : null
});

/**
 * Return all dashboard sessions.
 *
 * @param {PrismaClient} db
 * @returns {Promise<DashboardSessionData[]>}
 */
export const getDashboardSessions = async (db) => {
	const rows = await db.dashboardSession.findMany();

	return rows.map(sessionRowToData);
};

/**
 * Find a session by token.
 *
 * @param {PrismaClient} db
 * @param {string}       token
 * @returns {Promise<DashboardSessionData|null>}
 */
export const getDashboardSession = async (db, token) => {
	const row = await db.dashboardSession.findUnique({ where: { token } });

	return row ? sessionRowToData(row) : null;
};

/**
 * Persist a new or updated dashboard session.
 *
 * @param {PrismaClient}         db
 * @param {DashboardSessionData} data
 * @returns {Promise<void>}
 */
export const upsertDashboardSession = async (db, data) => {
	await db.dashboardSession.upsert({
		where: { token: data.token },
		update: {
			role: data.role,
			phoneNumber: data.phoneNumber,
			name: data.name,
			lastSeenAt: data.lastSeenAt !== null ? BigInt(Math.round(data.lastSeenAt)) : null,
			expiresAt: data.expiresAt !== null ? BigInt(Math.round(data.expiresAt)) : null
		},
		create: {
			token: data.token,
			role: data.role,
			phoneNumber: data.phoneNumber ?? null,
			name: data.name ?? null,
			lastSeenAt: data.lastSeenAt !== null ? BigInt(Math.round(data.lastSeenAt)) : null,
			expiresAt: data.expiresAt !== null ? BigInt(Math.round(data.expiresAt)) : null
		}
	});
};

/**
 * Update the `lastSeenAt` timestamp for a session.
 *
 * @param {PrismaClient} db
 * @param {string}       token
 * @param {number}       timestamp
 * @returns {Promise<void>}
 */
export const touchDashboardSession = async (db, token, timestamp) => {
	await db.dashboardSession.updateMany({
		where: { token },
		data: { lastSeenAt: BigInt(Math.round(timestamp)) }
	});
};

/**
 * Delete a dashboard session by token.
 *
 * @param {PrismaClient} db
 * @param {string}       token
 * @returns {Promise<void>}
 */
export const deleteDashboardSession = async (db, token) => {
	await db.dashboardSession.deleteMany({ where: { token } });
};

/**
 * Delete all expired sessions.
 *
 * @param {PrismaClient} db
 * @param {number}       now  Unix-ms timestamp
 * @returns {Promise<void>}
 */
export const purgeExpiredDashboardSessions = async (db, now) => {
	await db.dashboardSession.deleteMany({
		where: { expiresAt: { lt: BigInt(Math.round(now)) } }
	});
};

// ─────────────────────────────────────────────────────────────────────────────
// Audit logs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} AuditLogData
 * @property {number}      id
 * @property {number}      timestamp
 * @property {string}      action
 * @property {string}      actorRole
 * @property {string}      actor
 * @property {string|null} target
 * @property {string}      status
 * @property {string|null} message
 * @property {unknown}     before
 * @property {unknown}     after
 */

/** @param {import('@prisma/client').DashboardAuditLog} row */
const auditRowToData = (row) => ({
	id: row.logId,
	timestamp: Number(row.timestamp),
	action: row.action,
	actorRole: row.actorRole,
	actor: row.actor,
	target: row.target ?? null,
	status: row.status,
	message: row.message ?? null,
	before: row.before ? JSON.parse(row.before) : null,
	after: row.after ? JSON.parse(row.after) : null
});

/**
 * Append a new audit log entry.
 *
 * @param {PrismaClient}                db
 * @param {Omit<AuditLogData, 'id'>}    entry
 * @param {number}                      nextId  Application-managed sequential ID.
 * @returns {Promise<void>}
 */
export const appendAuditLog = async (db, entry, nextId) => {
	await db.dashboardAuditLog.create({
		data: {
			logId: nextId,
			timestamp: BigInt(Math.round(entry.timestamp)),
			action: entry.action,
			actorRole: entry.actorRole,
			actor: entry.actor,
			target: entry.target ?? null,
			status: entry.status,
			message: entry.message ?? null,
			before: entry.before !== null && entry.before !== undefined ? JSON.stringify(entry.before) : null,
			after: entry.after !== null && entry.after !== undefined ? JSON.stringify(entry.after) : null
		}
	});
};

/**
 * Return the last `limit` audit log entries, newest first.
 *
 * @param {PrismaClient} db
 * @param {number}       [limit=100]
 * @returns {Promise<AuditLogData[]>}
 */
export const getAuditLogs = async (db, limit = 100) => {
	const rows = await db.dashboardAuditLog.findMany({
		orderBy: { logId: 'desc' },
		take: limit
	});

	return rows.map(auditRowToData);
};

/**
 * Return the highest `logId` stored (used to resume the sequential counter).
 *
 * @param {PrismaClient} db
 * @returns {Promise<number>}
 */
export const getLastAuditLogId = async (db) => {
	const row = await db.dashboardAuditLog.findFirst({ orderBy: { logId: 'desc' } });
	
	return row?.logId ?? 0;
};

/**
 * Delete entries that exceed the retention limit.
 *
 * @param {PrismaClient} db
 * @param {number}       maxLogs
 * @returns {Promise<void>}
 */
export const pruneAuditLogs = async (db, maxLogs) => {
	// Find the Nth newest entry and delete everything older.
	const rows = await db.dashboardAuditLog.findMany({
		orderBy: { logId: 'desc' },
		skip: maxLogs,
		take: 1,
		select: { logId: true }
	});

	if (rows.length) {
		await db.dashboardAuditLog.deleteMany({ where: { logId: { lte: rows[0].logId } } });
	}
};

// ─────────────────────────────────────────────────────────────────────────────
// Blocklist
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return all blocklisted values.
 *
 * @param {PrismaClient} db
 * @returns {Promise<string[]>}
 */
export const getDashboardBlocklist = async (db) => {
	const rows = await db.dashboardBlocklist.findMany({ select: { value: true } });

	return rows.map((r) => r.value);
};

/**
 * Add a value to the blocklist.  Idempotent.
 *
 * @param {PrismaClient} db
 * @param {string}       value
 * @returns {Promise<void>}
 */
export const addToBlocklist = async (db, value) => {
	await db.dashboardBlocklist.upsert({
		where: { value },
		update: {},
		create: { value }
	});
};

/**
 * Remove a value from the blocklist.
 *
 * @param {PrismaClient} db
 * @param {string}       value
 * @returns {Promise<void>}
 */
export const removeFromBlocklist = async (db, value) => {
	await db.dashboardBlocklist.deleteMany({ where: { value } });
};

// ─────────────────────────────────────────────────────────────────────────────
// OTPs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} OtpData
 * @property {string}      phoneNumber
 * @property {string}      otp
 * @property {number|null} expiresAt
 */

/**
 * Upsert an OTP record for a phone number.
 *
 * @param {PrismaClient} db
 * @param {OtpData}      data
 * @returns {Promise<void>}
 */
export const upsertOtp = async (db, data) => {
	await db.dashboardOtp.upsert({
		where: { phoneNumber: data.phoneNumber },
		update: {
			otp: data.otp,
			expiresAt: data.expiresAt !== null ? BigInt(Math.round(data.expiresAt)) : null
		},
		create: {
			phoneNumber: data.phoneNumber,
			otp: data.otp,
			expiresAt: data.expiresAt !== null ? BigInt(Math.round(data.expiresAt)) : null
		}
	});
};

/**
 * Retrieve an OTP record by phone number.
 *
 * @param {PrismaClient} db
 * @param {string}       phoneNumber
 * @returns {Promise<OtpData|null>}
 */
export const getOtp = async (db, phoneNumber) => {
	const row = await db.dashboardOtp.findUnique({ where: { phoneNumber } });

	if (!row) return null;

	return {
		phoneNumber: row.phoneNumber,
		otp: row.otp,
		expiresAt: row.expiresAt !== null ? Number(row.expiresAt) : null
	};
};

/**
 * Delete the OTP record for a phone number.
 *
 * @param {PrismaClient} db
 * @param {string}       phoneNumber
 * @returns {Promise<void>}
 */
export const deleteOtp = async (db, phoneNumber) => {
	await db.dashboardOtp.deleteMany({ where: { phoneNumber } });
};

/**
 * Delete all expired OTPs.
 *
 * @param {PrismaClient} db
 * @param {number}       now  Unix-ms timestamp
 * @returns {Promise<void>}
 */
export const purgeExpiredOtps = async (db, now) => {
	await db.dashboardOtp.deleteMany({
		where: { expiresAt: { lt: BigInt(Math.round(now)) } }
	});
};
