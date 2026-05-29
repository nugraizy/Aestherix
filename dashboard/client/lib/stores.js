import { writable } from 'svelte/store';

export const status = writable({
	connected: false,
	uptime: null,
	uptimeSeconds: 0,
	commands: 0,
	commandsEnabled: 0,
	flagsEnabled: 0,
	flagsTotal: 0,
	version: '',
	platform: '',
	nodeVersion: '',
	cpuCount: 0,
	cpuPercent: 0,
	processCpu: 0,
	totalMemory: 0,
	freeMemory: 0,
	rss: 0,
	heapUsed: 0,
	heapTotal: 0,
	loadAverage: [0, 0, 0],
	processUptime: 0,
	sessions: 0,
	botOnline: true,
	botMode: 'embedded',
	waConnected: false,
	pm2: false
});

export const commands = writable([]);
export const flags = writable([]);
export const users = writable([]);
export const logs = writable([]);
export const prefixConfig = writable({ mode: 'single', values: ['.'] });

export const albums = writable({
	pictures: [],
	colorFilter: '',
	loading: false,
	loaded: false,
	lastFetchedAt: 0
});

export const messageLogs = writable({
	messages: [],
	search: '',
	jidFilter: '',
	loading: false,
	loaded: false,
	lastFetchedAt: 0
});

export const maintenanceMode = writable(false);

export const toolPanels = writable([]);

export const changelogOpen = writable(false);
