import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { getLocale, t, useLocale } from './i18n/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REMINDERS_FILE = path.join(__dirname, '../../databases/reminders.json');

let reminders = new Map();
let timers = new Map();
let clientInstance = null;

const loadReminders = () => {
	try {
		if (fs.existsSync(REMINDERS_FILE)) {
			const data = fs.readJsonSync(REMINDERS_FILE);

			for (const [id, reminder] of Object.entries(data)) {
				reminders.set(id, reminder);
			}
		}
	} catch {
		reminders = new Map();
	}
};

const saveReminders = () => {
	try {
		const data = Object.fromEntries(reminders);

		fs.writeJsonSync(REMINDERS_FILE, data, { spaces: '\t' });
	} catch (error) {
		console.error('Failed to save reminders:', error.message);
	}
};

const parseTime = (input) => {
	const match = input.match(/^(\d+)(s|m|h|d)$/);

	if (!match) {
		return null;
	}

	const value = parseInt(match[1], 10);
	const unit = match[2];

	const multipliers = {
		s: 1000,
		m: 60 * 1000,
		h: 60 * 60 * 1000,
		d: 24 * 60 * 60 * 1000
	};

	return value * multipliers[unit];
};

const formatTime = (ms) => {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) {
		return `${days}d ${hours % 24}h`;
	}

	if (hours > 0) {
		return `${hours}h ${minutes % 60}m`;
	}

	if (minutes > 0) {
		return `${minutes}m ${seconds % 60}s`;
	}

	return `${seconds}s`;
};

const generateId = () => {
	return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
};

const triggerReminder = async (reminder) => {
	if (!clientInstance) {
		return;
	}

	try {
		const mention = `@${reminder.sender.split('@')[0]}`;
		const locale = await getLocale(reminder.chatId);
		const L = useLocale(locale, 'common');

		await clientInstance.send(
			reminder.chatId,
			{
				text: `⏰ ${t(locale, 'common.core.reminder.header', [reminder.message, mention])}`,
				mentions: [reminder.sender]
			}
		);
	} catch (error) {
		console.error('Failed to send reminder:', error.message);
	}

	reminders.delete(reminder.id);
	timers.delete(reminder.id);
	saveReminders();
};

const scheduleReminder = (reminder) => {
	const delay = reminder.triggerAt - Date.now();

	if (delay <= 0) {
		triggerReminder(reminder);
		return;
	}

	const timer = setTimeout(() => {
		triggerReminder(reminder);
	}, delay);

	timers.set(reminder.id, timer);
};

export const reminderManager = {
	init: (client) => {
		clientInstance = client;
		loadReminders();

		for (const [, reminder] of reminders) {
			if (reminder.triggerAt > Date.now()) {
				scheduleReminder(reminder);
			} else {
				triggerReminder(reminder);
			}
		}
	},

	add: (chatId, sender, message, delayMs) => {
		const id = generateId();
		const reminder = {
			id,
			chatId,
			sender,
			message,
			createdAt: Date.now(),
			triggerAt: Date.now() + delayMs
		};

		reminders.set(id, reminder);
		saveReminders();
		scheduleReminder(reminder);

		return reminder;
	},

	cancel: (id) => {
		const reminder = reminders.get(id);

		if (!reminder) {
			return false;
		}

		if (timers.has(id)) {
			clearTimeout(timers.get(id));
			timers.delete(id);
		}

		reminders.delete(id);
		saveReminders();

		return true;
	},

	list: (sender) => {
		const userReminders = [];

		for (const [, reminder] of reminders) {
			if (reminder.sender === sender) {
				userReminders.push(reminder);
			}
		}

		return userReminders.sort((a, b) => a.triggerAt - b.triggerAt);
	},

	cancelAll: (sender) => {
		let count = 0;

		for (const [id, reminder] of reminders) {
			if (reminder.sender === sender) {
				if (timers.has(id)) {
					clearTimeout(timers.get(id));
					timers.delete(id);
				}

				reminders.delete(id);
				count++;
			}
		}

		saveReminders();

		return count;
	},

	parseTime,
	formatTime
};
