import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { Cache } from './modules/cache.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SLOWMODE_FILE = path.join(__dirname, '../../databases/slowmode.json');

let slowModeSettings = new Map();
let userMessageTimes = new Cache({ maxAge: 60000 });

const loadSettings = () => {
	try {
		if (fs.existsSync(SLOWMODE_FILE)) {
			const data = fs.readJsonSync(SLOWMODE_FILE);

			for (const [groupId, settings] of Object.entries(data)) {
				slowModeSettings.set(groupId, settings);
			}
		}
	} catch {
		slowModeSettings = new Map();
	}
};

const saveSettings = () => {
	try {
		const data = Object.fromEntries(slowModeSettings);

		fs.writeJsonSync(SLOWMODE_FILE, data, { spaces: '\t' });
	} catch (error) {
		console.error('Failed to save slowmode settings:', error.message);
	}
};

export const slowModeManager = {
	init: () => {
		loadSettings();
	},

	set: (groupId, duration, excludeAdmins = true) => {
		const settings = {
			duration,
			excludeAdmins,
			enabled: true
		};

		slowModeSettings.set(groupId, settings);
		saveSettings();

		return settings;
	},

	disable: (groupId) => {
		if (slowModeSettings.has(groupId)) {
			slowModeSettings.get(groupId).enabled = false;
			saveSettings();
			return true;
		}

		return false;
	},

	enable: (groupId) => {
		if (slowModeSettings.has(groupId)) {
			slowModeSettings.get(groupId).enabled = true;
			saveSettings();
			return true;
		}

		return false;
	},

	remove: (groupId) => {
		if (slowModeSettings.has(groupId)) {
			slowModeSettings.delete(groupId);
			saveSettings();
			return true;
		}

		return false;
	},

	get: (groupId) => {
		return slowModeSettings.get(groupId) || null;
	},

	list: () => {
		const result = [];

		for (const [groupId, settings] of slowModeSettings) {
			result.push({ groupId, ...settings });
		}

		return result;
	},

	check: (groupId, userId, isAdmin = false) => {
		const settings = slowModeSettings.get(groupId);

		if (!settings || !settings.enabled) {
			return { allowed: true };
		}

		if (settings.excludeAdmins && isAdmin) {
			return { allowed: true };
		}

		const key = `${groupId}:${userId}`;
		const lastMessage = userMessageTimes.get(key);

		if (lastMessage) {
			const elapsed = Date.now() - lastMessage;
			const remaining = settings.duration * 1000 - elapsed;

			if (remaining > 0) {
				return {
					allowed: false,
					remaining: Math.ceil(remaining / 1000)
				};
			}
		}

		userMessageTimes.set(key, Date.now());

		return { allowed: true };
	}
};
