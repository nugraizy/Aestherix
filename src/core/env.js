// @ts-check
/**
 * Centralised environment access.
 *
 * Reads raw `process.env` once, validates with zod, freezes the result.
 * Optional integration secrets are kept optional so the bot still boots
 * without them — only the secret-gated features stop working.
 *
 * Two exports:
 *   - `env`      : frozen object with parsed/typed values
 *   - `redact()` : helper that replaces any non-trivial secret value
 *                  appearing inside a string with '***'. Used by Logger.
 *
 * dotenv loading happens in the project's root `index.js` before this
 * module is imported, so `process.env` is already populated.
 */

import { z } from 'zod';

const optionalString = z.string().min(1).optional();
const optionalNumber = z.coerce.number().int().positive().optional();

const envSchema = z
	.object({
		// ── Runtime ────────────────────────────────────────────────────
		NODE_ENV: z.string().default('development'),
		TRACE: z
			.union([z.string(), z.boolean()])
			.optional()
			.transform((value) => value === true || value === '1' || value === 'true'),

		// ── Database (Prisma) ──────────────────────────────────────────
		// Required at runtime (asserted in boot). Optional here so that
		// tests, which do not load the .env file, can import this module
		// without the schema rejecting an empty DATABASE_URL.
		DATABASE_PROVIDER: z.string().default('sqlite'),
		DATABASE_URL: z.string().default(''),

		// ── Bot / pairing ──────────────────────────────────────────────
		PAIR_NUMBER: optionalString,

		// ── Dashboard ──────────────────────────────────────────────────
		DASHBOARD_EMBEDDED: z.string().default('1'),
		DASHBOARD_PORT: optionalNumber,
		DASHBOARD_BRIDGE_PORT: z.coerce.number().int().positive().default(4010),
		DASHBOARD_BRIDGE_TOKEN: z.string().default('aestherix-local-bridge-token'),

		// ── MQTT ───────────────────────────────────────────────────────
		MQTT_URL: optionalString,
		MQTT_SPOTIFY_BIO: optionalString,
		MQTT_SPOTIFY_PLAYBACK: optionalString,
		MQTT_FREEGAME: optionalString,

		// ── GitHub ─────────────────────────────────────────────────────
		GITHUB_CLIENT_ID: optionalString,
		GITHUB_SECRET: optionalString,
		GITHUB_ACCESS: optionalString,
		GITHUB_AUTH_TOKEN: optionalString,
		GITHUB_SECRET_WEBHOOK: optionalString,

		// ── Instagram ──────────────────────────────────────────────────
		INSTAGRAM_USERNAME: optionalString,
		INSTAGRAM_PASSWORD: optionalString,
		INSTAGRAM_SESI: optionalString,

		// ── Twitter / X ────────────────────────────────────────────────
		TWITTER_COOKIE: optionalString,
		TWITTER_API_KEY: optionalString,
		TWITTER_API_KEY_SECRET: optionalString,
		TWITTER_ACCESS_TOKEN: optionalString,
		TWITTER_GUEST_ACCESS_TOKEN: optionalString,

		// ── Spotify ────────────────────────────────────────────────────
		SPOTIFY_CLIENT_ID: optionalString,
		SPOTIFY_CLIENT_SECRET: optionalString,
		SPOTIFY_ACCESS_TOKEN: optionalString,
		SPOTIFY_REFRESH_TOKEN: optionalString,
		SPOTIFY_ACCESS_CREDENTIAL_TOKEN: optionalString,
		SPOTIFY_DEVICE_ID: optionalString,

		// ── Bluesky ────────────────────────────────────────────────────
		BLUESKY_IDENTIFIER: optionalString,
		BLUESKY_PASSWORD: optionalString,

		// ── Telegram ───────────────────────────────────────────────────
		TELEGRAM_TOKEN: optionalString,

		// ── AI / image services ────────────────────────────────────────
		OPENAI_KEY: optionalString,
		BING_COOKIE: optionalString,
		DEEP_KEY: optionalString,
		REMOVEBG_KEY: optionalString,
		UBERDUCK_BASIC: optionalString,

		// ── MyAnimeList ────────────────────────────────────────────────
		MAL_ID: optionalString,
		MAL_SECRET: optionalString,
		MAL_REFRESH: optionalString,
		MAL_ACCESS: optionalString,

		// ── Search / scraping APIs ─────────────────────────────────────
		ARQ_KEY: optionalString,
		RAPID_TOKEN: optionalString,
		PEXEL_TOKEN: optionalString,
		FLICKR_KEY: optionalString,
		FLICKR_SECRET: optionalString,
		WEATHER_KEY: optionalString,
		WEB_SCREENSHOT: optionalString,
		PINTEREST_COOKIE: optionalString,
		YOUTUBE_AUTH: optionalString,
		COOKIE_BRAINANS_COM: optionalString,
		COOKIE_TIKTOK_COM: optionalString,

		// ── Game tuning ────────────────────────────────────────────────
		WEREWOLF_LOBBY_TIMEOUT_MS: optionalString
	})
	.passthrough();

function parseEnv(source) {
	const result = envSchema.safeParse(source);

	if (result.success) {
		return result.data;
	}

	const fieldErrors = result.error.issues.map((issue) => `  ${issue.path.join('.')}: ${issue.message}`).join('\n');

	throw new Error(
		`Environment validation failed.\n${fieldErrors}\n\n` + 'Check your .env (see example.env for the canonical template).'
	);
}

/** @type {Readonly<z.infer<typeof envSchema>>} */
export const env = Object.freeze(parseEnv(process.env));

/**
 * Keys whose values should be redacted in logs. Values shorter than
 * MIN_SECRET_LENGTH are skipped to avoid replacing common substrings.
 */
const SECRET_KEYS = new Set([
	'DATABASE_URL',
	'GITHUB_CLIENT_ID',
	'GITHUB_SECRET',
	'GITHUB_ACCESS',
	'GITHUB_AUTH_TOKEN',
	'GITHUB_SECRET_WEBHOOK',
	'INSTAGRAM_PASSWORD',
	'INSTAGRAM_SESI',
	'TWITTER_COOKIE',
	'TWITTER_API_KEY',
	'TWITTER_API_KEY_SECRET',
	'TWITTER_ACCESS_TOKEN',
	'TWITTER_GUEST_ACCESS_TOKEN',
	'SPOTIFY_CLIENT_SECRET',
	'SPOTIFY_ACCESS_TOKEN',
	'SPOTIFY_REFRESH_TOKEN',
	'SPOTIFY_ACCESS_CREDENTIAL_TOKEN',
	'BLUESKY_PASSWORD',
	'TELEGRAM_TOKEN',
	'OPENAI_KEY',
	'BING_COOKIE',
	'DEEP_KEY',
	'REMOVEBG_KEY',
	'UBERDUCK_BASIC',
	'MAL_SECRET',
	'MAL_REFRESH',
	'MAL_ACCESS',
	'ARQ_KEY',
	'RAPID_TOKEN',
	'PEXEL_TOKEN',
	'FLICKR_KEY',
	'FLICKR_SECRET',
	'WEATHER_KEY',
	'WEB_SCREENSHOT',
	'PINTEREST_COOKIE',
	'YOUTUBE_AUTH',
	'COOKIE_BRAINANS_COM',
	'COOKIE_TIKTOK_COM',
	'DASHBOARD_BRIDGE_TOKEN',
	'MQTT_URL'
]);
const MIN_SECRET_LENGTH = 8;

/**
 * Newline-separated secret values get split per line so each line gets
 * redacted individually (some keys hold multiple credentials).
 */
function collectSecretValues() {
	const values = new Set();

	for (const key of SECRET_KEYS) {
		const value = env[key];

		if (typeof value !== 'string' || !value) {
			continue;
		}

		const lines = value
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean);

		for (const line of lines) {
			if (line.length >= MIN_SECRET_LENGTH) {
				values.add(line);
			}
		}
	}

	return [...values].sort((a, b) => b.length - a.length);
}

const SECRET_VALUES = collectSecretValues();

/**
 * Replace every known secret value inside `text` with '***'.
 * Returns the input unchanged if it is not a string or if no secrets
 * are configured.
 *
 * @param {unknown} text
 * @returns {unknown}
 */
export function redact(text) {
	if (typeof text !== 'string' || SECRET_VALUES.length === 0) {
		return text;
	}

	let out = text;

	for (const secret of SECRET_VALUES) {
		out = out.split(secret).join('***');
	}

	return out;
}
