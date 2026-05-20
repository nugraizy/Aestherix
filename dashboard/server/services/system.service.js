import fs from 'fs-extra';
import os from 'os';

import { getEmbeddedWaClient, isBotEmbeddedHere } from '../lib/client.js';
import { ROOT_CHANGELOG_PATH } from '../lib/paths.js';

const KV_CONTRIBUTORS_KEY = 'dashboard_contributors';
const LIVE_SESSION_WINDOW_MS = 30 * 1000;

function readPackageVersion() {
	try {
		return fs.readJSONSync('./package.json')?.version || 'unknown';
	} catch {
		return 'unknown';
	}
}

function buildGitHubHeaders() {
	const headers = {
		Accept: 'application/vnd.github+json',
		'User-Agent': 'aestherix-bot'
	};

	if (process.env.GITHUB_AUTH_TOKEN) {
		headers.Authorization = `Bearer ${process.env.GITHUB_AUTH_TOKEN}`;
	}

	return headers;
}

async function getLatestCommitHash() {
	try {
		const response = await fetch('https://api.github.com/repos/nugraizy/aestherix/commits?per_page=1', {
			headers: buildGitHubHeaders()
		});

		if (!response.ok) {
			return null;
		}

		const [commit] = await response.json();

		return commit?.sha || null;
	} catch {
		return null;
	}
}

async function fetchContributorsFromGitHub() {
	const response = await fetch('https://api.github.com/repos/nugraizy/aestherix/contributors?per_page=50', {
		headers: buildGitHubHeaders()
	});

	if (!response.ok) {
		throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
	}

	const data = await response.json();

	return data
		.filter((user) => user.type === 'User')
		.map((user) => ({
			name: user.login,
			login: user.login,
			email: '',
			commits: user.contributions,
			profileUrl: user.html_url,
			avatarUrl: `https://avatars.githubusercontent.com/${user.login}?size=128`
		}));
}

export function createSystemService({ configuration, prisma, monitor, spotify, auth, botBridge } = {}) {
	if (!configuration) {
		throw new Error('system.service: configuration is required');
	}

	const projectVersion = readPackageVersion();
	let previousSystemCpu = null;
	let previousProcessCpu = {
		usage: process.cpuUsage(),
		time: process.hrtime.bigint()
	};
	let cachedBotState = { online: true, mode: 'embedded', waConnected: false, lastCheckedAt: 0 };
	const BOT_PING_TTL_MS = 1500;

	function isBotEmbedded() {
		return isBotEmbeddedHere();
	}

	async function sampleBotState() {
		if (isBotEmbedded()) {
			const waClient = getEmbeddedWaClient();

			cachedBotState = {
				online: true,
				mode: 'embedded',
				waConnected: Boolean(waClient),
				lastCheckedAt: Date.now()
			};

			return cachedBotState;
		}

		if (!botBridge?.pingBot) {
			cachedBotState = { online: false, mode: 'split', waConnected: false, lastCheckedAt: Date.now() };

			return cachedBotState;
		}

		const now = Date.now();

		if (cachedBotState.lastCheckedAt && now - cachedBotState.lastCheckedAt < BOT_PING_TTL_MS) {
			return cachedBotState;
		}

		const result = await botBridge.pingBot({ timeoutMs: 800 });

		cachedBotState = {
			online: Boolean(result?.online),
			mode: 'split',
			waConnected: Boolean(result?.waConnected),
			lastCheckedAt: now
		};

		return cachedBotState;
	}

	function sampleSystemCpuPercent() {
		const cpus = os.cpus();
		const current = cpus.reduce(
			(acc, cpu) => {
				const total = Object.values(cpu.times).reduce((sum, value) => sum + value, 0);

				acc.idle += cpu.times.idle;
				acc.total += total;

				return acc;
			},
			{ idle: 0, total: 0 }
		);

		if (!previousSystemCpu) {
			previousSystemCpu = current;
			return 0;
		}

		const idleDelta = current.idle - previousSystemCpu.idle;
		const totalDelta = current.total - previousSystemCpu.total;

		previousSystemCpu = current;

		if (totalDelta <= 0) {
			return 0;
		}

		return Number((((totalDelta - idleDelta) / totalDelta) * 100).toFixed(2));
	}

	function sampleProcessCpuPercent() {
		const nowUsage = process.cpuUsage();
		const nowTime = process.hrtime.bigint();
		const elapsedMicros = Number(nowTime - previousProcessCpu.time) / 1000;
		const usedMicros = nowUsage.user - previousProcessCpu.usage.user + (nowUsage.system - previousProcessCpu.usage.system);

		previousProcessCpu = { usage: nowUsage, time: nowTime };

		if (elapsedMicros <= 0) {
			return 0;
		}

		return Number(((usedMicros / elapsedMicros) * 100).toFixed(2));
	}

	function countActiveSessions() {
		const io = configuration.dashboard?.io;

		return io?.of('/')?.sockets?.size || 0;
	}

	async function getStatus() {
		const mem = process.memoryUsage();
		const commands = monitor?.listCommands?.() || [];
		const totalCommands = commands.length;
		const enabledCommands = commands.filter((command) => command.enabled).length;
		const disabledCount = Math.max(0, totalCommands - enabledCommands);
		const flagEntries = Object.entries(configuration.flags || {}).filter(([, value]) => typeof value === 'boolean');
		const enabledFlags = flagEntries.filter(([, value]) => Boolean(value)).length;
		const spotifyData = spotify?.getNowPlaying ? await spotify.getNowPlaying() : null;
		const botState = await sampleBotState();

		return {
			timestamp: Date.now(),
			project: { version: projectVersion },
			pm2: Boolean(process.env.pm_id || process.env.PM2_HOME),
			system: {
				platform: process.platform,
				nodeVersion: process.version,
				cpus: os.cpus().length,
				cpuPercent: sampleSystemCpuPercent(),
				totalMemory: os.totalmem(),
				freeMemory: os.freemem(),
				uptimeSeconds: os.uptime(),
				loadAverage: os.loadavg()
			},
			process: {
				pid: process.pid,
				uptimeSeconds: process.uptime(),
				cpuPercent: sampleProcessCpuPercent(),
				rss: mem.rss,
				heapUsed: mem.heapUsed,
				heapTotal: mem.heapTotal,
				external: mem.external
			},
			bot: {
				online: Boolean(botState?.online),
				mode: botState?.mode || 'embedded',
				waConnected: Boolean(botState?.waConnected)
			},
			commands: { total: totalCommands, disabled: disabledCount, enabled: enabledCommands },
			flags: {
				total: flagEntries.length,
				enabled: enabledFlags,
				disabled: Math.max(0, flagEntries.length - enabledFlags)
			},
			spotify: spotifyData,
			sessions: { activeUsers: countActiveSessions() }
		};
	}

	async function getChangelog() {
		if (!(await fs.pathExists(ROOT_CHANGELOG_PATH))) {
			return null;
		}

		return fs.readFile(ROOT_CHANGELOG_PATH, 'utf8');
	}

	async function getContributors() {
		if (!prisma) {
			return fetchContributorsFromGitHub();
		}

		const cached = await prisma.dashboardKV.findUnique({
			where: { key_sessionName: { key: KV_CONTRIBUTORS_KEY, sessionName: 'main' } }
		});
		const parsed = cached?.value ? JSON.parse(cached.value) : null;
		const latestHash = await getLatestCommitHash();

		if (parsed && latestHash && parsed.commitHash === latestHash) {
			return parsed.contributors;
		}

		const contributors = await fetchContributorsFromGitHub();

		await prisma.dashboardKV.deleteMany({
			where: { key: KV_CONTRIBUTORS_KEY, sessionName: 'main' }
		});
		await prisma.dashboardKV.create({
			data: {
				key: KV_CONTRIBUTORS_KEY,
				sessionName: 'main',
				value: JSON.stringify({ commitHash: latestHash, contributors })
			}
		});

		return contributors;
	}

	function getHealth() {
		const mqttConnected = Boolean(configuration.mqtt?.connected);
		const embeddedMode = isBotEmbeddedHere();
		const waClient = getEmbeddedWaClient();

		return {
			database: {
				provider: process.env.DATABASE_PROVIDER || 'unknown',
				connected: true
			},
			bot: {
				embedded: embeddedMode,
				waConnected: Boolean(waClient),
				sessionName: configuration.core?.sessionName || 'unknown'
			},
			mqtt: { connected: mqttConnected },
			bridge: { configured: Boolean(botBridge?.isConfigured) },
			profilePictures: {
				cacheSize: configuration.pinterest?.images?.size || 0
			}
		};
	}

	function getCacheStats() {
		return {
			groups: {
				metadata: configuration.groups?.metadata?.size || 0,
				settings: configuration.groups?.settings?.size || 0
			},
			users: configuration.users?.size || 0,
			commands: configuration.registry?.commands?.size || 0,
			commandUsage: configuration.registry?.commandUsage?.size || 0,
			pinterest: configuration.pinterest?.images?.size || 0,
			anonymous: {
				sessions: configuration.anonymous?.sessions?.size || 0,
				messages: configuration.anonymous?.messages?.size || 0
			},
			games: {
				tebakGambar: configuration.games?.tebakGambar?.size || 0,
				akinator: configuration.games?.akinator?.size || 0,
				wordle: configuration.games?.wordle?.size || 0,
				werewolf: configuration.games?.werewolf?.size || 0
			}
		};
	}

	function getEnvKeyPresence() {
		const keys = [
			'DATABASE_URL',
			'DATABASE_PROVIDER',
			'DASHBOARD_PORT',
			'DASHBOARD_EMBEDDED',
			'DASHBOARD_BRIDGE_PORT',
			'DASHBOARD_BRIDGE_TOKEN',
			'DASHBOARD_BOT_BRIDGE_URL',
			'GITHUB_AUTH_TOKEN',
			'GITHUB_SECRET_WEBHOOK',
			'INSTAGRAM_USERNAME',
			'INSTAGRAM_PASSWORD',
			'MQTT_URL',
			'MQTT_SPOTIFY_BIO',
			'MQTT_FREEGAME',
			'PAIR_NUMBER',
			'BOT_PM2_APP_NAME',
			'SPOTIFY_CLIENT_ID',
			'SPOTIFY_CLIENT_SECRET'
		];

		return keys.map((key) => ({ key, set: Boolean(process.env[key]) }));
	}

	return {
		projectVersion,
		sampleSystemCpuPercent,
		sampleProcessCpuPercent,
		getStatus,
		getHealth,
		getCacheStats,
		getEnvKeyPresence,
		getChangelog,
		getContributors
	};
}
