import fs from 'fs-extra';
import { z } from 'zod';

import { toUserJid } from '../../../src/helper/misc/wa_data/index.js';
import { color } from '../../../src/utils/modules/index.js';

const SETTINGS_PATH = './src/helper/config/settings.json';
const PROTECTED_FIELDS = ['prefix', 'best_time'];

const phoneNumberRegex = /^\d{6,20}$/;

function normalizePhoneInput(value) {
	return String(value || '')
		.trim()
		.split('@')[0]
		.replace(/\D/g, '');
}

const PhoneSchema = z
	.string()
	.transform(normalizePhoneInput)
	.pipe(z.string().regex(phoneNumberRegex, 'Must be a phone number, digits only'));

const SettingsPatchSchema = z
	.object({
		main_host_number: PhoneSchema,
		backups_host_numbers: z.array(PhoneSchema),
		owner_number: PhoneSchema,
		team_number: z.array(PhoneSchema),
		main_session: z.string().min(1).max(64),
		maintenance: z.boolean(),
		max_group: z.number().int().min(1).max(10000),
		min_members: z.number().int().min(1).max(10000),
		limit: z.number().int().min(0).max(100000),
		logger_theme: z.string().min(1).max(64),
		packname: z.string().max(120),
		author: z.string().max(120)
	})
	.partial();

function stripProtected(snapshot) {
	const out = { ...(snapshot || {}) };

	for (const key of PROTECTED_FIELDS) {
		delete out[key];
	}

	return out;
}

function applyToConfiguration(configuration, snapshot) {
	configuration.settings = snapshot;
	configuration.owners = [
		toUserJid(snapshot.owner_number),
		...(snapshot.team_number || []).map(toUserJid)
	].filter(Boolean);

	if (typeof snapshot.logger_theme === 'string' && snapshot.logger_theme.length > 0) {
		configuration.logger_theme = snapshot.logger_theme;
		color.setTheme(snapshot.logger_theme);
	}

	if (typeof snapshot.packname === 'string' && snapshot.packname.length > 0) {
		configuration.packname = snapshot.packname;
	}

	if (typeof snapshot.author === 'string' && snapshot.author.length > 0) {
		configuration.author = snapshot.author;
	}
}

async function writeAtomic(snapshot) {
	const tmp = `${SETTINGS_PATH}.tmp.${process.pid}.${Date.now()}`;

	await fs.writeJSON(tmp, snapshot, { spaces: 2 });
	await fs.rename(tmp, SETTINGS_PATH);
}

export function createSettingsService({ configuration, botBridge } = {}) {
	if (!configuration) {
		throw new Error('settings.service: configuration is required');
	}

	async function readRaw() {
		return fs.readJSON(SETTINGS_PATH).catch(() => ({}));
	}

	async function read() {
		const data = await readRaw();
		const exposed = stripProtected(data);

		exposed.packname = exposed.packname || configuration.packname || '';
		exposed.author = exposed.author || configuration.author || '';

		return exposed;
	}

	function validate(patch) {
		const result = SettingsPatchSchema.safeParse(patch);

		if (!result.success) {
			const message = result.error.issues
				.map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
				.join('; ');

			return { ok: false, message };
		}

		return { ok: true, data: result.data };
	}

	async function bridgeSync() {
		if (!botBridge?.sendRuntimeSync) {
			return;
		}

		await botBridge.sendRuntimeSync({ type: 'settings.update', payload: {} }).catch(() => {});
	}

	async function update(patch) {
		const validation = validate(patch);

		if (!validation.ok) {
			return { ok: false, status: 400, message: validation.message };
		}

		for (const key of PROTECTED_FIELDS) {
			if (key in validation.data) {
				delete validation.data[key];
			}
		}

		const previous = await readRaw();
		const next = { ...previous };

		for (const [key, value] of Object.entries(validation.data)) {
			next[key] = value;
		}

		try {
			await writeAtomic(next);
		} catch (error) {
			return { ok: false, status: 500, message: error?.message || 'Failed writing settings.json' };
		}

		applyToConfiguration(configuration, next);
		await bridgeSync();

		return {
			ok: true,
			settings: stripProtected(next),
			previous: stripProtected(previous),
			changedKeys: Object.keys(validation.data)
		};
	}

	async function restore(snapshot) {
		if (!snapshot || typeof snapshot !== 'object') {
			return { ok: false, status: 400, message: 'Invalid undo snapshot.' };
		}

		const current = await readRaw();
		const next = {
			...current,
			...snapshot,
			prefix: current.prefix,
			best_time: current.best_time
		};

		try {
			await writeAtomic(next);
		} catch (error) {
			return { ok: false, status: 500, message: error?.message || 'Failed writing settings.json' };
		}

		applyToConfiguration(configuration, next);
		await bridgeSync();

		return { ok: true, settings: stripProtected(next) };
	}

	return {
		read,
		readRaw,
		update,
		validate,
		restore
	};
}
