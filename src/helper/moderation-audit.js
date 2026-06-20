import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUDIT_FILE = path.join(__dirname, '../../databases/moderation_audit.json');
const MAX_ENTRIES = 1000;

let auditLog = [];

const loadLog = () => {
	try {
		if (fs.existsSync(AUDIT_FILE)) {
			auditLog = fs.readJsonSync(AUDIT_FILE);
		}
	} catch {
		auditLog = [];
	}
};

const saveLog = () => {
	try {
		fs.writeJsonSync(AUDIT_FILE, auditLog, { spaces: '\t' });
	} catch {
		/* non-critical persistence failure */
	}
};

export const moderationAudit = {
	init() {
		loadLog();
	},

	log({ group, moderator, action, target, reason = '', metadata = {} }) {
		const entry = {
			id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
			timestamp: new Date().toISOString(),
			group,
			moderator,
			action,
			target,
			reason,
			metadata
		};

		auditLog.push(entry);

		if (auditLog.length > MAX_ENTRIES) {
			auditLog = auditLog.slice(-MAX_ENTRIES);
		}

		saveLog();

		return entry;
	},

	search({ group, user, keyword, limit = 10 } = {}) {
		let results = auditLog;

		if (group) {
			results = results.filter((e) => e.group === group);
		}

		if (user) {
			results = results.filter((e) => e.moderator === user || e.target === user);
		}

		if (keyword) {
			const lower = keyword.toLowerCase();

			results = results.filter(
				(e) => e.action.toLowerCase().includes(lower) || (e.reason && e.reason.toLowerCase().includes(lower))
			);
		}

		return results.slice(-limit).reverse();
	}
};
