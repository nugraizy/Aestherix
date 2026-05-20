import { loadCommandUsage as loadCommandUsageFromDB } from '../../src/helper/database/adapters/command-usage.js';
import {
	loadCommandsCatalog,
	loadDashboardState,
	saveCommandsCatalog,
	saveDashboardState
} from '../../src/helper/database/adapters/dashboard-settings.js';
import prisma from '../../src/helper/database/prisma.js';

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
	const options = configuration?.flags || {};

	return Object.entries(options)
		.filter(([, value]) => typeof value === 'boolean')
		.reduce((acc, [key, value]) => {
			acc[key] = Boolean(value);
			return acc;
		}, {});
};

const safeRead = async () => {
	const data = await loadDashboardState(prisma).catch(() => ({ disabledCommands: [], flagStates: {} }));

	return data;
};

const applyPersistedFlags = (configuration, flagStates) => {
	if (!configuration?.flags || !flagStates || typeof flagStates !== 'object') {
		return;
	}

	const cliFlags = configuration?.cli?.flags || {};

	for (const [key, value] of Object.entries(flagStates)) {
		if (typeof configuration.flags[key] !== 'boolean') {
			continue;
		}

		if (typeof cliFlags[key] === 'boolean') {
			continue;
		}

		configuration.flags[key] = Boolean(value);
	}
};

const persist = async (configuration) => {
	const disabledCommands = Array.from(normalizeSet(configuration?.registry?.disabledCommands)).sort((a, b) =>
		a.localeCompare(b)
	);
	const flagStates = extractBooleanFlags(configuration);

	await saveDashboardState(prisma, { disabledCommands, flagStates }).catch(() => {});
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

let _commandsCatalogCache = null;

const writeCommandsCatalog = (configuration) => {
	try {
		const disabled = normalizeSet(configuration?.registry?.disabledCommands);
		const commandEntries = configuration?.registry?.commands?.entries?.() || [];
		const commands = commandEntries
			.filter(([name]) => !name.startsWith('UNKNOWN-'))
			.map(([, command]) => toCommandPayload(command, disabled))
			.sort((a, b) => a.name.localeCompare(b.name));

		_commandsCatalogCache = commands;
		void saveCommandsCatalog(prisma, { updatedAt: Date.now(), commands });
	} catch {
		// Ignore command catalog persistence issues.
	}
};

const readCommandsCatalogSync = () => {
	return _commandsCatalogCache || [];
};

const hydrateCommandsCatalogCache = async () => {
	try {
		const commands = await loadCommandsCatalog(prisma);

		if (commands.length) {
			_commandsCatalogCache = commands;
		}
	} catch {
		// Ignore DB errors; catalog will populate when commands are loaded.
	}
};

export const initializeDashboardMonitor = async (configuration) => {
	if (state.initialized) {
		return;
	}

	const data = await safeRead();

	configuration.registry.disabledCommands = new Set(data.disabledCommands);
	applyPersistedFlags(configuration, data.flagStates);

	if (!configuration?.flags || typeof configuration.flags !== 'object') {
		configuration.flags = {};
	}

	for (const [key, value] of Object.entries(data.flagStates)) {
		if (typeof value !== 'boolean') {
			continue;
		}

		if (typeof configuration.flags[key] !== 'boolean') {
			configuration.flags[key] = value;
		}
	}

	const raw = await loadCommandUsageFromDB(prisma).catch(() => ({}));

	for (const [name, count] of Object.entries(raw)) {
		configuration.registry.commandUsage.set(name, count);
	}

	await hydrateCommandsCatalogCache();
	state.initialized = true;
};

export const listDashboardFlags = (configuration) => {
	return Object.entries(configuration?.flags || {})
		.filter(([, value]) => typeof value === 'boolean')
		.map(([name, enabled]) => ({
			name,
			enabled: Boolean(enabled)
		}))
		.sort((a, b) => a.name.localeCompare(b.name));
};

export const listDashboardCommands = (configuration) => {
	const disabled = normalizeSet(configuration?.registry?.disabledCommands);
	const commands = configuration?.registry?.commands?.entries?.() || [];

	if (!commands.length) {
		const cached = readCommandsCatalogSync();

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
			const usageCount = Number(configuration?.registry?.commandUsage?.get?.(command.name) || 0);
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
	const disabled = normalizeSet(configuration?.registry?.disabledCommands);

	return !disabled.has(commandName);
};

export const setDashboardCommandState = async (configuration, commandName, enabled) => {
	const commandsSize = Number(configuration?.registry?.commands?.size || 0);
	const exists = configuration?.registry?.commands?.has?.(commandName);

	if (commandsSize > 0 && !exists) {
		return { ok: false, message: 'Command not found.' };
	}

	if (!configuration.registry.disabledCommands) {
		configuration.registry.disabledCommands = new Set();
	}

	if (enabled) {
		configuration.registry.disabledCommands.delete(commandName);
	} else {
		configuration.registry.disabledCommands.add(commandName);
	}

	await persist(configuration);

	if (commandsSize > 0) {
		writeCommandsCatalog(configuration);
	}

	return { ok: true, enabled };
};

export const setDashboardFlagState = async (configuration, flagName, enabled) => {
	if (!configuration?.flags || typeof configuration.flags !== 'object') {
		configuration.flags = {};
	}

	if (!Object.prototype.hasOwnProperty.call(configuration.flags, flagName)) {
		configuration.flags[flagName] = Boolean(enabled);
		await persist(configuration);
		return { ok: true, enabled: Boolean(enabled) };
	}

	if (typeof configuration.flags[flagName] !== 'boolean') {
		return { ok: false, message: 'Only boolean flags can be toggled.' };
	}

	configuration.flags[flagName] = Boolean(enabled);
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
