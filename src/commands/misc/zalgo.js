import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { zalgo } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'zalgo',
	minifiedDescription: 'Zalgofie Text',
	description: 'Convert Text to Zalgo text',
	usage: '!zalgo `<query>`',
	category: 'Misc',
	aliases: ['tozalgo', 'zalg'],
	limit: 2,
	cooldown: 3,
	status: 'enable',
	async run({ query, from, message, bodyQuoted }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query && !bodyQuoted) {
			return await client.reply(from, L.errors.textRequired, message);
		}

		await client.reply(from, zalgo(query || bodyQuoted, { size: 'maxi' }), message);
	}
});
