import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'setbio',
	minifiedDescription: 'Change Bio',
	description: "Set the bot's bio"  ,
	usage: '!setbio `<bio>`',
	aliases: ['setinfo'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, query, message }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return await client.reply(from, L.errors.bioRequired, message);
		}

		await client.setStatus(query);
	}
});
