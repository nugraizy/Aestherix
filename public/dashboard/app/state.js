import { DEFAULT_DASHBOARD_SETTINGS } from './constants.js';

export const state = {
	lastDashboardLogId: 0,
	dashboardLogs: [],
	lastBotLogId: 0,
	botLogs: [],
	auditLogs: [],
	lastAuditId: 0,
	commands: [],
	flags: [],
	users: [],
	profilePictures: [],
	metricHistory: {
		sysCpu: [],
		procCpu: [],
		memoryPercent: []
	},
	chartHoverIndices: {
		sysCpu: null,
		procCpu: null,
		memoryPercent: null
	},
	alertSnapshot: {
		sysCpu: 0,
		procCpu: 0,
		memoryPercent: 0
	},
	selectedUserIds: new Set(),
	bulkUsersBusy: false,
	userLimitDrafts: new Map(),
	userLimitSaveVersions: new Map(),
	collapsedCategories: new Set(),
	searchByFolder: {
		commands: '',
		flags: '',
		users: '',
		profilePictures: '',
		editor: ''
	},
	searchFilters: {
		commandsState: 'all',
		commandsSort: 'name-asc',
		flagsState: 'all',
		usersRole: 'all',
		usersStatus: 'all'
	},
	sectionStates: {
		logs: { kind: 'idle', message: '' },
		audit: { kind: 'idle', message: '' },
		commands: { kind: 'idle', message: '' },
		flags: { kind: 'idle', message: '' },
		users: { kind: 'idle', message: '' },
		profilePictures: { kind: 'idle', message: '' },
		editor: { kind: 'idle', message: '' }
	},
	settings: {
		...DEFAULT_DASHBOARD_SETTINGS
	},
	auditActionCollapsed: false,
	auditRoleCollapsed: false,
	activeFolder: 'commands',
	role: null,
	canEdit: false
};
