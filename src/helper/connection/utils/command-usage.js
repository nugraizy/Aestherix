import prisma from '../../database/prisma.js';
import {
	loadCommandUsage as loadCommandUsageFromDB,
	incrementCommandUsage as incrementCommandUsageInDB,
	setCommandUsage as setCommandUsageInDB
} from '../../database/adapters/command-usage.js';
import { Cache } from '../../modules/cache.js';

const WRITE_DEBOUNCE_MS = 1500;

const state = {
	loaded: false,
	writeTimer: null
};

const ensureUsageCache = (configuration) => {
	if (!configuration?.cmds?.commandUsage) {
		configuration.cmds.commandUsage = new Cache();
	}
};

const persistCommandUsage = async (configuration) => {
	state.writeTimer = null;
	const usageCache = configuration?.cmds?.commandUsage;

	if (!usageCache || typeof usageCache.entries !== 'function') {
		return;
	}

	const tasks = [];

	for (const [command, value] of usageCache.entries()) {
		const count = Math.floor(Number(value) || 0);

		if (Number.isFinite(count) && count >= 0) {
			tasks.push(setCommandUsageInDB(prisma, command, count));
		}
	}

	if (tasks.length) {
		await Promise.all(tasks);
	}
};

const schedulePersist = (configuration) => {
	if (state.writeTimer) {
		return;
	}

	state.writeTimer = setTimeout(() => {
		void persistCommandUsage(configuration);
	}, WRITE_DEBOUNCE_MS);
};

export const loadCommandUsage = async (configuration) => {
	if (state.loaded) {
		return;
	}

	state.loaded = true;
	ensureUsageCache(configuration);

	const raw = await loadCommandUsageFromDB(prisma).catch(() => ({}));

	for (const [commandName, count] of Object.entries(raw)) {
		configuration.cmds.commandUsage.set(commandName, count);
	}
};

export const incrementCommandUsage = async (configuration, commandName) => {
	if (!commandName) {
		return;
	}

	await loadCommandUsage(configuration);

	const currentCount = Number(configuration.cmds.commandUsage.get(commandName) || 0);

	configuration.cmds.commandUsage.set(commandName, currentCount + 1);

	// Fire-and-forget the DB increment (no need to wait)
	void incrementCommandUsageInDB(prisma, commandName);

	schedulePersist(configuration);
};

export const flushCommandUsage = async (configuration) => {
	if (state.writeTimer) {
		clearTimeout(state.writeTimer);
		state.writeTimer = null;
	}

	await persistCommandUsage(configuration);
};
