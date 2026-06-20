import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

const EPHEMERAL_DURATIONS = {
	'off': 0,
	'0': 0,
	'24h': 86400,
	'1d': 86400,
	'7d': 604800,
	'1w': 604800,
	'90d': 7776000,
	'3m': 7776000
};

export default defineCommand({
	name: 'ephemeral',
	minifiedDescription: 'Toggle ephemeral messages',
	description: 'Toggle disappearing messages for the group.',
	usage: '!ephemeral `<off/24h/7d/90d>`',
	aliases: ['disappearing', 'eph'],
	category: 'Moderation',
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ isBotAdmin, from, message, args, isGroup }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!isGroup) {
			return await client.reply(from, L.errors.groupOnly, message);
		}

		if (!isBotAdmin) {
			return await client.reply(from, L.errors.botNotAdmin, message);
		}

		const duration = args[1]?.toLowerCase();

		if (!duration || !EPHEMERAL_DURATIONS.hasOwnProperty(duration)) {
			return await client.reply(
				from,
				'Usage: !ephemeral `<off/24h/7d/90d>`\n\nOptions:\n• off — Disable ephemeral\n• 24h — 24 hours\n• 7d — 7 days\n• 90d — 90 days',
				message
			);
		}

		try {
			const seconds = EPHEMERAL_DURATIONS[duration];

			await client.groupToggleEphemeral(from, seconds);

			if (seconds === 0) {
				await client.reply(from, 'Ephemeral messages disabled.', message);
			} else {
				await client.reply(from, `Ephemeral messages set to ${duration}.`, message);
			}
		} catch (error) {
			await client.reply(from, `Failed to toggle ephemeral: ${error.message}`, message);
		}
	}
});
