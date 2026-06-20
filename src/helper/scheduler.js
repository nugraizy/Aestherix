import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEDULES_FILE = path.join(__dirname, '../../databases/schedules.json');

let schedules = new Map();
let cronJobs = new Map();
let clientInstance = null;

const loadSchedules = () => {
	try {
		if (fs.existsSync(SCHEDULES_FILE)) {
			const data = fs.readJsonSync(SCHEDULES_FILE);

			for (const [id, schedule] of Object.entries(data)) {
				schedules.set(id, schedule);
			}
		}
	} catch {
		schedules = new Map();
	}
};

const saveSchedules = () => {
	try {
		const data = Object.fromEntries(schedules);

		fs.writeJsonSync(SCHEDULES_FILE, data, { spaces: '\t' });
	} catch (error) {
		console.error('Failed to save schedules:', error.message);
	}
};

const generateId = () => {
	return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
};

const parseCronExpression = (input) => {
	const patterns = {
		'daily': '0 9 * * *',
		'hourly': '0 * * * *',
		'weekly': '0 9 * * 1',
		'monthly': '0 9 1 * *'
	};

	if (patterns[input]) {
		return patterns[input];
	}

	const timeMatch = input.match(/^(\d{1,2}):(\d{2})$/);

	if (timeMatch) {
		const hour = parseInt(timeMatch[1], 10);
		const minute = parseInt(timeMatch[2], 10);

		if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
			return `${minute} ${hour} * * *`;
		}
	}

	const dayTimeMatch = input.match(/^(\d{1,2}):(\d{2})\s+(mon|tue|wed|thu|fri|sat|sun)$/i);

	if (dayTimeMatch) {
		const hour = parseInt(dayTimeMatch[1], 10);
		const minute = parseInt(dayTimeMatch[2], 10);
		const dayMap = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0 };
		const day = dayMap[dayTimeMatch[3].toLowerCase()];

		if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
			return `${minute} ${hour} * * ${day}`;
		}
	}

	return null;
};

const scheduleMessage = (schedule) => {
	if (!cron.validate(schedule.cron)) {
		return false;
	}

	const job = cron.schedule(schedule.cron, async () => {
		if (!clientInstance) {
			return;
		}

		try {
			await clientInstance.send(schedule.chatId, { text: schedule.message });
		} catch (error) {
			console.error('Failed to send scheduled message:', error.message);
		}
	}, {
		scheduled: true,
		timezone: schedule.timezone || 'UTC'
	});

	cronJobs.set(schedule.id, job);
	return true;
};

export const schedulerManager = {
	init: (client) => {
		clientInstance = client;
		loadSchedules();

		for (const [, schedule] of schedules) {
			scheduleMessage(schedule);
		}
	},

	add: (chatId, sender, message, cronExpression, timezone = 'UTC') => {
		const id = generateId();
		const schedule = {
			id,
			chatId,
			sender,
			message,
			cron: cronExpression,
			timezone,
			createdAt: Date.now()
		};

		schedules.set(id, schedule);
		saveSchedules();

		if (!scheduleMessage(schedule)) {
			schedules.delete(id);
			saveSchedules();
			return null;
		}

		return schedule;
	},

	cancel: (id) => {
		const schedule = schedules.get(id);

		if (!schedule) {
			return false;
		}

		if (cronJobs.has(id)) {
			cronJobs.get(id).stop();
			cronJobs.delete(id);
		}

		schedules.delete(id);
		saveSchedules();

		return true;
	},

	list: (chatId) => {
		const chatSchedules = [];

		for (const [, schedule] of schedules) {
			if (schedule.chatId === chatId) {
				chatSchedules.push(schedule);
			}
		}

		return chatSchedules.sort((a, b) => a.createdAt - b.createdAt);
	},

	cancelAll: (chatId) => {
		let count = 0;

		for (const [id, schedule] of schedules) {
			if (schedule.chatId === chatId) {
				if (cronJobs.has(id)) {
					cronJobs.get(id).stop();
					cronJobs.delete(id);
				}

				schedules.delete(id);
				count++;
			}
		}

		saveSchedules();

		return count;
	},

	parseCronExpression
};
