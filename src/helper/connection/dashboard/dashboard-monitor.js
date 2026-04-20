import fs from 'fs-extra';
import path from 'path';

import { loadCommandUsage } from '../utils/command-usage.js';

const DASHBOARD_STATE_PATH = './databases/dashboard/dashboard-settings.json';
const DASHBOARD_COMMANDS_CACHE_PATH = './databases/dashboard/dashboard-commands-cache.json';
const MAX_LOGS = 500;

const state = {
	initialized: false,
	logs: [],
	lastLogId: 0
};

const normalizeSet = (value) => {
	if (value instanceof Set) {
		return value;
	}

	if (Array.isArray(value)) {
		return new Set(value);
	}

	return new Set();
};

const extractBooleanFlags = (configuration) => {
	const options = configuration?.OPTIONS || {};

	return Object.entries(options)
		.filter(([, value]) => typeof value === 'boolean')
		.reduce((acc, [key, value]) => {
			acc[key] = Boolean(value);
			return acc;
		}, {});
};

const safeRead = async () => {
	if (!(await fs.pathExists(DASHBOARD_STATE_PATH))) {
		await fs.ensureDir(path.dirname(DASHBOARD_STATE_PATH));
		await fs.writeJSON(DASHBOARD_STATE_PATH, { disabledCommands: [], flagStates: {} }, { spaces: 2 });
		return { disabledCommands: [], flagStates: {} };
	}

	const raw = await fs.readJSON(DASHBOARD_STATE_PATH);
	const disabledCommands = Array.isArray(raw?.disabledCommands) ? raw.disabledCommands : [];
	const flagStates =
		raw?.flagStates && typeof raw.flagStates === 'object' && !Array.isArray(raw.flagStates) ? raw.flagStates : {};

	const normalizedFlagStates = Object.entries(flagStates)
		.filter(([, value]) => typeof value === 'boolean')
		.reduce((acc, [key, value]) => {
			acc[key] = value;
			return acc;
		}, {});

	return {
		disabledCommands,
		flagStates: normalizedFlagStates
	};
};

const applyPersistedFlags = (configuration, flagStates) => {
	if (!configuration?.OPTIONS || !flagStates || typeof flagStates !== 'object') {
		return;
	}

	for (const [key, value] of Object.entries(flagStates)) {
		if (typeof configuration.OPTIONS[key] !== 'boolean') {
			continue;
		}

		configuration.OPTIONS[key] = Boolean(value);
	}
};

const persist = async (configuration) => {
	const disabledCommands = Array.from(normalizeSet(configuration?.cmds?.disabledCommands)).sort((a, b) => a.localeCompare(b));
	const flagStates = extractBooleanFlags(configuration);

	await fs.ensureDir(path.dirname(DASHBOARD_STATE_PATH));
	await fs.writeJSON(DASHBOARD_STATE_PATH, { disabledCommands, flagStates }, { spaces: 2 });
};

const toCommandPayload = (command, disabled) => {
	const aliases = Array.isArray(command?.aliases) ? command.aliases : [];

	return {
		name: command.name,
		category: command.category || 'Uncategorized',
		aliases,
		description: command.description || '',
		usage: command.usage || '',
		cooldown: Number(command.cooldown || 0),
		limit: Number(command.limit || 0),
		premium: Boolean(command.premium),
		restrict: Boolean(command.restrict),
		enabled: !disabled.has(command.name)
	};
};

const writeCommandsCatalog = (configuration) => {
	try {
		const disabled = normalizeSet(configuration?.cmds?.disabledCommands);
		const commandEntries = configuration?.cmds?.commands?.entries?.() || [];
		const commands = commandEntries
			.filter(([name]) => !name.startsWith('UNKNOWN-'))
			.map(([, command]) => toCommandPayload(command, disabled))
			.sort((a, b) => a.name.localeCompare(b.name));

		fs.ensureDirSync(path.dirname(DASHBOARD_COMMANDS_CACHE_PATH));
		fs.writeJSONSync(
			DASHBOARD_COMMANDS_CACHE_PATH,
			{
				updatedAt: Date.now(),
				commands
			},
			{ spaces: 2 }
		);
	} catch {
		// Ignore command catalog persistence issues.
	}
};

const readCommandsCatalog = () => {
	try {
		if (!fs.pathExistsSync(DASHBOARD_COMMANDS_CACHE_PATH)) {
			return [];
		}

		const raw = fs.readJSONSync(DASHBOARD_COMMANDS_CACHE_PATH);
		const commands = Array.isArray(raw?.commands) ? raw.commands : [];

		return commands
			.map((command) => ({
				name: String(command?.name || ''),
				category: String(command?.category || 'Uncategorized'),
				aliases: Array.isArray(command?.aliases) ? command.aliases.map((alias) => String(alias)) : [],
				description: String(command?.description || ''),
				usage: String(command?.usage || ''),
				cooldown: Number(command?.cooldown || 0),
				limit: Number(command?.limit || 0),
				premium: Boolean(command?.premium),
				restrict: Boolean(command?.restrict),
				enabled: Boolean(command?.enabled)
			}))
			.filter((command) => Boolean(command.name));
	} catch {
		return [];
	}
};

export const initializeDashboardMonitor = async (configuration) => {
	if (state.initialized) {
		return;
	}

	const data = await safeRead();

	configuration.cmds.disabledCommands = new Set(data.disabledCommands);
	applyPersistedFlags(configuration, data.flagStates);

	if (!configuration?.OPTIONS || typeof configuration.OPTIONS !== 'object') {
		configuration.OPTIONS = {};
	}

	for (const [key, value] of Object.entries(data.flagStates)) {
		if (typeof value !== 'boolean') {
			continue;
		}

		if (typeof configuration.OPTIONS[key] !== 'boolean') {
			configuration.OPTIONS[key] = value;
		}
	}

	await loadCommandUsage(configuration);
	state.initialized = true;
};

export const listDashboardFlags = (configuration) => {
	return Object.entries(configuration?.OPTIONS || {})
		.filter(([, value]) => typeof value === 'boolean')
		.map(([name, enabled]) => ({
			name,
			enabled: Boolean(enabled)
		}))
		.sort((a, b) => a.name.localeCompare(b.name));
};

export const listDashboardCommands = (configuration) => {
	const disabled = normalizeSet(configuration?.cmds?.disabledCommands);
	const commands = configuration?.cmds?.commands?.entries?.() || [];

	if (!commands.length) {
		const cached = readCommandsCatalog();

		return cached
			.map((command) => ({
				...command,
				enabled: !disabled.has(command.name)
			}))
			.sort((a, b) => a.name.localeCompare(b.name));
	}

	writeCommandsCatalog(configuration);

	return commands
		.filter(([name]) => !name.startsWith('UNKNOWN-'))
		.map(([, command]) => {
			const usageCount = Number(configuration?.cmds?.commandUsage?.get?.(command.name) || 0);
			const payload = toCommandPayload(command, disabled);

			return {
				...payload,
				usageCount,
				enabled: payload.enabled
			};
		})
		.sort((a, b) => a.name.localeCompare(b.name));
};

export const isCommandEnabled = (configuration, commandName) => {
	const disabled = normalizeSet(configuration?.cmds?.disabledCommands);

	return !disabled.has(commandName);
};

export const setDashboardCommandState = async (configuration, commandName, enabled) => {
	const commandsSize = Number(configuration?.cmds?.commands?.size || 0);
	const exists = configuration?.cmds?.commands?.has?.(commandName);

	if (commandsSize > 0 && !exists) {
		return { ok: false, message: 'Command not found.' };
	}

	if (!configuration.cmds.disabledCommands) {
		configuration.cmds.disabledCommands = new Set();
	}

	if (enabled) {
		configuration.cmds.disabledCommands.delete(commandName);
	} else {
		configuration.cmds.disabledCommands.add(commandName);
	}

	await persist(configuration);

	if (commandsSize > 0) {
		writeCommandsCatalog(configuration);
	}

	return { ok: true, enabled };
};

export const setDashboardFlagState = async (configuration, flagName, enabled) => {
	if (!configuration?.OPTIONS || typeof configuration.OPTIONS !== 'object') {
		configuration.OPTIONS = {};
	}

	if (!Object.prototype.hasOwnProperty.call(configuration.OPTIONS, flagName)) {
		configuration.OPTIONS[flagName] = Boolean(enabled);
		await persist(configuration);
		return { ok: true, enabled: Boolean(enabled) };
	}

	if (typeof configuration.OPTIONS[flagName] !== 'boolean') {
		return { ok: false, message: 'Only boolean flags can be toggled.' };
	}

	configuration.OPTIONS[flagName] = Boolean(enabled);
	await persist(configuration);

	return { ok: true, enabled: Boolean(enabled) };
};

export const refreshDashboardCommandCatalog = (configuration) => {
	writeCommandsCatalog(configuration);
};

export const pushDashboardLog = (level, ...info) => {
	state.lastLogId += 1;

	state.logs.push({
		id: state.lastLogId,
		timestamp: Date.now(),
		level,
		message: info.map((value) => String(value)).join(' ')
	});

	if (state.logs.length > MAX_LOGS) {
		state.logs.splice(0, state.logs.length - MAX_LOGS);
	}
};

export const getDashboardLogs = ({ since = 0, limit = 200 } = {}) => {
	const safeLimit = Math.max(1, Math.min(500, Number(limit) || 200));
	const safeSince = Number(since) || 0;

	const filtered = state.logs.filter((entry) => entry.id > safeSince);
	const logs = filtered.slice(-safeLimit);

	return {
		lastId: state.lastLogId,
		logs
	};
};
