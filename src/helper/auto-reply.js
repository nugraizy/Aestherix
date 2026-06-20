import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTOREPLIES_FILE = path.join(__dirname, '../../databases/autoreplies.json');

let autoReplies = new Map();

const loadAutoReplies = () => {
	try {
		if (fs.existsSync(AUTOREPLIES_FILE)) {
			const data = fs.readJsonSync(AUTOREPLIES_FILE);

			for (const [id, reply] of Object.entries(data)) {
				autoReplies.set(id, reply);
			}
		}
	} catch {
		autoReplies = new Map();
	}
};

const saveAutoReplies = () => {
	try {
		const data = Object.fromEntries(autoReplies);

		fs.writeJsonSync(AUTOREPLIES_FILE, data, { spaces: '\t' });
	} catch (error) {
		console.error('Failed to save auto-replies:', error.message);
	}
};

const generateId = () => {
	return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
};

export const autoReplyManager = {
	init: () => {
		loadAutoReplies();
	},

	add: (chatId, sender, pattern, response, options = {}) => {
		const id = generateId();
		const reply = {
			id,
			chatId,
			sender,
			pattern: pattern.toLowerCase(),
			response,
			isRegex: options.isRegex || false,
			cooldown: options.cooldown || 0,
			lastTriggered: 0,
			createdAt: Date.now()
		};

		autoReplies.set(id, reply);
		saveAutoReplies();

		return reply;
	},

	remove: (id) => {
		if (!autoReplies.has(id)) {
			return false;
		}

		autoReplies.delete(id);
		saveAutoReplies();

		return true;
	},

	list: (chatId) => {
		const replies = [];

		for (const [, reply] of autoReplies) {
			if (reply.chatId === chatId) {
				replies.push(reply);
			}
		}

		return replies.sort((a, b) => a.createdAt - b.createdAt);
	},

	removeAll: (chatId) => {
		let count = 0;

		for (const [id, reply] of autoReplies) {
			if (reply.chatId === chatId) {
				autoReplies.delete(id);
				count++;
			}
		}

		saveAutoReplies();

		return count;
	},

	check: (chatId, message) => {
		const now = Date.now();
		const matches = [];

		for (const [, reply] of autoReplies) {
			if (reply.chatId !== chatId) {
				continue;
			}

			if (reply.cooldown > 0 && now - reply.lastTriggered < reply.cooldown * 1000) {
				continue;
			}

			let matched = false;

			if (reply.isRegex) {
				try {
					const regex = new RegExp(reply.pattern, 'i');

					matched = regex.test(message);
				} catch {
					matched = false;
				}
			} else {
				matched = message.toLowerCase().includes(reply.pattern);
			}

			if (matched) {
				reply.lastTriggered = now;
				matches.push(reply);
			}
		}

		if (matches.length > 0) {
			saveAutoReplies();
		}

		return matches;
	}
};
