import { delay } from '../../utils/modules/index.js';
import { search } from '../../utils/anonymous/index.js';
import configuration from '../../helper/index.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'search',
	minifiedDescription: 'Anonymous Search',
	description: 'Search for a partner',
	category: 'Anonymous',
	usage: '!search',
	aliases: ['find', 'findpartner'],
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ from, message }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		const result = search(from, 20, client, message);

		if (result === true) {
			const { key } = await client.reply(from, L.success.searchingPartner, message);

			configuration.anonymous.messages.set(from, key);
			return;
		}

		if (result.partner2) {
			const { key } = await client.reply(result.partner2, L.success.searchingPartner, message);

			configuration.anonymous.messages.set(result.partner2, key);

			await delay(2_500);

			await client.edit(result.partner1, 'Your partner is found!', configuration.anonymous.messages.get(result.partner1));
			await client.edit(result.partner2, 'Your partner is found!', configuration.anonymous.messages.get(result.partner2));
			return;
		}

		if (result.status === 'chatting') {
			await client.reply(from, L.errors.alreadyChatting, message);
		} else {
			await client.reply(from, L.errors.alreadySearching, message);
		}
	}
});
