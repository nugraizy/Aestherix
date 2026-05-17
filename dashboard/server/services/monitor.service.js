import {
	getDashboardLogs,
	initializeDashboardMonitor,
	isCommandEnabled,
	listDashboardCommands,
	listDashboardFlags,
	pushDashboardLog,
	refreshDashboardCommandCatalog,
	setDashboardCommandState,
	setDashboardFlagState
} from '../monitor.js';

export function createMonitorService({ configuration } = {}) {
	if (!configuration) {
		throw new Error('monitor.service: configuration is required');
	}

	return {
		async initialize() {
			await initializeDashboardMonitor(configuration);
		},
		listCommands() {
			return listDashboardCommands(configuration);
		},
		listFlags() {
			return listDashboardFlags(configuration);
		},
		isCommandEnabled(commandName) {
			return isCommandEnabled(configuration, commandName);
		},
		setCommandState(commandName, enabled) {
			return setDashboardCommandState(configuration, commandName, enabled);
		},
		setFlagState(flagName, enabled) {
			return setDashboardFlagState(configuration, flagName, enabled);
		},
		getLogs(opts) {
			return getDashboardLogs(opts);
		},
		pushLog(entry) {
			return pushDashboardLog(entry);
		},
		refreshCatalog() {
			return refreshDashboardCommandCatalog(configuration);
		}
	};
}
