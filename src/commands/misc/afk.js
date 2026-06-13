import { setAfk } from '../../helper/index.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'afk',
	minifiedDescription: 'AFK Mode',
	description: 'Going away from keyboard.',
	category: 'Misc',
	usage: '!afk `<reason|no reason>`',
	aliases: ['away', 'idle'],
	limit: 2,
	cooldown: 3,
	status: 'enable',
	async run({ message, from, query, isGroup, sender, pushname }, client) {
		if (!isGroup) {
			const locale = await getLocale(from);
			const L = useLocale(locale, 'common');

			return await client.reply(from, L.errors.groupOnly, message);
		}

		setAfk(sender, from, query, pushname);

		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		await client.send(
			from,
			{ text: `@${sender.split('@')[0]} ${L.info.afk || 'is now AFK.'}`, mentions: [sender] },
			{ quoted: message }
		);
	}
});
