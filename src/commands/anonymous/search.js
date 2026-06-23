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
	async run({ from, message, sender }, client) {
		const locale = await getLocale(from, sender);
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

			const locale1 = await getLocale(result.partner1);
			const L1 = useLocale(locale1, 'common');
			const locale2 = await getLocale(result.partner2);
			const L2 = useLocale(locale2, 'common');

			await client.edit(result.partner1, L1.info.partnerFound, configuration.anonymous.messages.get(result.partner1));
			await client.edit(result.partner2, L2.info.partnerFound, configuration.anonymous.messages.get(result.partner2));
			return;
		}

		if (result.status === 'chatting') {
			await client.reply(from, L.errors.alreadyChatting, message);
		} else {
			await client.reply(from, L.errors.alreadySearching, message);
		}
	}
});
