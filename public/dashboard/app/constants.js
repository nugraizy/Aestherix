export const COLLAPSE_STORAGE_KEY = 'aestherix.dashboard.collapsedCategories';
export const ACTIVE_FOLDER_STORAGE_KEY = 'aestherix.dashboard.activeFolder';
export const SETTINGS_STORAGE_KEY = 'aestherix.dashboard.settings';
export const THEME_STORAGE_KEY = 'aestherix.dashboard.theme';
export const THEME_PALETTE_STORAGE_KEY = 'aestherix.dashboard.palette';
export const AUDIT_ACTIONS_COLLAPSED_KEY = 'aestherix.dashboard.auditActionsCollapsed';
export const AUDIT_ROLES_COLLAPSED_KEY = 'aestherix.dashboard.auditRolesCollapsed';
export const AUDIT_ACTION_PARAM = 'auditAction';
export const AUDIT_ROLE_PARAM = 'auditRole';
export const AUDIT_QUERY_PARAM = 'auditQuery';
export const THEME_TRANSITION_MS = 520;
export const THEME_ICON_MORPH_MS = 760;
export const CHANGELOG_MARKDOWN_PATH = '/api/dashboard/changelog';
export const CONTRIBUTORS_PATH = '/api/dashboard/contributors';

export const SEARCH_PLACEHOLDERS = {
	commands: 'Search command/category/alias',
	flags: 'Search bot flags',
	users: 'Search users by number/id/role',
	profilePictures: 'Search profile pictures by timestamp/url',
	editor: 'Search command files'
};

export const ansiRegex = /\u001b\[[0-9;]*m/g;

export const DEFAULT_DASHBOARD_SETTINGS = {
	statusRefreshMs: 4000,
	logsRefreshMs: 3000,
	auditRefreshMs: 5000,
	dataRefreshMs: 12000,
	chartHistoryLimit: 45,
	autosaveDelayMs: 2000
};

export const ALERT_RULES = {
	systemCpuWarn: 85,
	systemCpuCritical: 95,
	processCpuWarn: 80,
	processCpuCritical: 92,
	memoryWarn: 85,
	memoryCritical: 94,
	errorSpikeWarnCount: 6,
	errorSpikeCriticalCount: 12,
	errorSpikeWindowSize: 120
};

export const ERROR_SPIKE_PATTERN = /(error|failed|exception|fatal|timeout|unhandled)/i;

export const DEFAULT_THEME_PALETTE = 'aestherix';
export const THEME_PALETTES = [
	'aestherix',
	'nord',
	'gruvbox',
	'solarized',
	'tokyo-night',
	'catppuccin-latte',
	'catppuccin-frappe',
	'catppuccin-macchiato',
	'catppuccin-mocha',
	'cyberpunk-2077',
	'dracula'
];
