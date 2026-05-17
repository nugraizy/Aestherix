import { Router } from 'express';
import fs from 'fs-extra';

import { color, loggers } from '../../../src/utils/modules/index.js';

const SETTINGS_PATH = './src/helper/config/settings.json';
const BASE_MULTI_CHARS = '°π÷×¶∆£¢€¥®™✓_=+|~!#$%^&./\\©^>';

function escapeCharClass(str) {
	return str.replace(/[[\]\\^$]/g, (m) => `\\${m}`);
}

function sameArray(left, right) {
	return (
		Array.isArray(left) &&
		Array.isArray(right) &&
		left.length === right.length &&
		left.every((value, index) => value === right[index])
	);
}

function buildPrefixConfig(mode, body) {
	if (mode === 'multi') {
		const cliPrefixes = Array.isArray(body.prefixes)
			? body.prefixes.filter((p) => typeof p === 'string' && p.length > 0)
			: [];
		const prefixValues = cliPrefixes.length
			? [...new Set([...BASE_MULTI_CHARS, ...cliPrefixes])]
			: [...BASE_MULTI_CHARS];
		const escaped = prefixValues.map(escapeCharClass).join('');

		return {
			config: {
				multi: true,
				nopref: false,
				pref: '.',
				cliPrefixes,
				prefixValues
			},
			regex: new RegExp(`^[${escaped}]`),
			values: prefixValues
		};
	}

	if (mode === 'nopref') {
		return {
			config: {
				multi: false,
				nopref: true,
				pref: body.pref || '.',
				cliPrefixes: [],
				prefixValues: []
			},
			regex: null,
			values: []
		};
	}

	const singlePref = typeof body.pref === 'string' && body.pref.length > 0 ? body.pref[0] : '.';

	return {
		config: {
			multi: false,
			nopref: false,
			pref: singlePref,
			cliPrefixes: [],
			prefixValues: [singlePref]
		},
		regex: null,
		values: [singlePref]
	};
}

export function createPrefixRouter({ services, configuration }) {
	const { audit, middleware } = services;
	const router = Router();

	router.get('/prefix', middleware.requireDashboardAuth, (_req, res) => {
		const prefixConfig = configuration.prefix.config || {};
		const settings = fs.readJSONSync(SETTINGS_PATH, { throws: false }) || {};
		const settingsPrefix = settings.prefix || {};

		res.json({
			mode: prefixConfig.multi ? 'multi' : prefixConfig.nopref ? 'nopref' : 'single',
			pref: prefixConfig.pref || settingsPrefix.pref || '.',
			multi: prefixConfig.multi ?? Boolean(settingsPrefix.multi),
			nopref: prefixConfig.nopref ?? Boolean(settingsPrefix.nopref),
			cliPrefixes: prefixConfig.cliPrefixes || [],
			prefixValues: prefixConfig.prefixValues || []
		});
	});

	router.post('/prefix', middleware.requireOwnerAuth, async (req, res) => {
		const session = req.dashboardSession;
		const { mode } = req.body || {};

		if (!['single', 'multi', 'nopref'].includes(mode)) {
			audit.push({
				action: 'prefix.change',
				session,
				target: 'prefix',
				status: 'failed',
				message: 'Invalid prefix mode. Must be single, multi, or nopref.'
			});
			return res
				.status(400)
				.json({ ok: false, message: 'Invalid mode. Must be single, multi, or nopref.' });
		}

		const next = buildPrefixConfig(mode, req.body || {});
		const currentConfig = configuration.prefix.config || {};
		const currentMode = currentConfig.multi ? 'multi' : currentConfig.nopref ? 'nopref' : 'single';
		const isSame =
			currentMode === mode &&
			currentConfig.pref === next.config.pref &&
			Boolean(currentConfig.multi) === Boolean(next.config.multi) &&
			Boolean(currentConfig.nopref) === Boolean(next.config.nopref) &&
			sameArray(currentConfig.cliPrefixes || [], next.config.cliPrefixes || []) &&
			sameArray(currentConfig.prefixValues || [], next.config.prefixValues || []);

		if (isSame) {
			return res.json({
				ok: true,
				mode,
				pref: next.config.pref,
				multi: next.config.multi,
				nopref: next.config.nopref
			});
		}

		const beforeMode = currentMode;
		const beforePref = currentConfig.pref;

		configuration.prefix.config = next.config;
		configuration.prefix.mode = mode;
		configuration.prefix.regex = next.regex;
		configuration.prefix.values = next.values;
		configuration.prefix.default = mode === 'nopref' ? '' : next.config.pref || '.';

		if (configuration.router) {
			configuration.router.updatePrefix({
				mode,
				value: configuration.prefix.default,
				regex: next.regex
			});
		}

		const currentSettings = await fs.readJSON(SETTINGS_PATH).catch(() => ({}));

		currentSettings.prefix = {
			multi: next.config.multi,
			nopref: next.config.nopref,
			pref: next.config.pref,
			customPrefixes: next.config.cliPrefixes || []
		};
		await fs.writeJSON(SETTINGS_PATH, currentSettings, { spaces: 2 }).catch(() => {});

		audit.push({
			action: 'prefix.change',
			session,
			target: 'prefix',
			before: { mode: beforeMode, pref: beforePref },
			after: { mode, pref: next.config.pref }
		});

		const displayPref =
			mode === 'multi'
				? next.config.cliPrefixes?.length
					? next.config.cliPrefixes.join('')
					: '(default)'
				: mode === 'nopref'
					? '(none)'
					: next.config.pref;

		loggers.info(
			color('Dashboard changed prefix:', 'white'),
			color(mode, 'lilac'),
			color('pref:', 'white'),
			color(displayPref, 'lilac')
		);

		res.json({
			ok: true,
			mode,
			pref: next.config.pref,
			multi: next.config.multi,
			nopref: next.config.nopref
		});
	});

	return router;
}
