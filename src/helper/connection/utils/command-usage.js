import fs from 'fs-extra';
import path from 'path';

import { Cache } from '../../modules/cache.js';

const COMMAND_USAGE_PATH = './databases/groups/command-usage.json';
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

const normalizeUsagePayload = (raw) => {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
		return {};
	}

	return Object.entries(raw).reduce((acc, [key, value]) => {
		const numeric = Number(value);

		if (Number.isFinite(numeric) && numeric >= 0) {
			acc[key] = Math.floor(numeric);
		}

		return acc;
	}, {});
};

const buildPayload = (configuration) => {
	const usageCache = configuration?.cmds?.commandUsage;
	const payload = {};

	if (!usageCache || typeof usageCache.entries !== 'function') {
		return payload;
	}

	for (const [key, value] of usageCache.entries()) {
		const numeric = Number(value);

		if (!Number.isFinite(numeric) || numeric < 0) {
			continue;
		}

		payload[key] = Math.floor(numeric);
	}

	return payload;
};

const persistCommandUsage = async (configuration) => {
	state.writeTimer = null;
	await fs.ensureDir(path.dirname(COMMAND_USAGE_PATH));
	await fs.writeJSON(COMMAND_USAGE_PATH, buildPayload(configuration), { spaces: 2 });
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

	if (!(await fs.pathExists(COMMAND_USAGE_PATH))) {
		await fs.ensureDir(path.dirname(COMMAND_USAGE_PATH));
		await fs.writeJSON(COMMAND_USAGE_PATH, {}, { spaces: 2 });
		return;
	}

	const raw = await fs.readJSON(COMMAND_USAGE_PATH).catch(() => ({}));
	const normalized = normalizeUsagePayload(raw);

	for (const [commandName, count] of Object.entries(normalized)) {
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

	schedulePersist(configuration);
};

export const flushCommandUsage = async (configuration) => {
	if (state.writeTimer) {
		clearTimeout(state.writeTimer);
		state.writeTimer = null;
	}

	await persistCommandUsage(configuration);
};
