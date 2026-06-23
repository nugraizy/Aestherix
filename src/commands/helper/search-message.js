import { BOT_NAME } from '../../core/constants.js';

import { delay } from 'baileys';
import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'searchmessage',
	minifiedDescription: 'Search Messages',
	description: 'Search for a message in the current group',
	usage: '!searchmessage',
	aliases: ['findmessage', 'searchmsg', 'findmsg'],
	category: 'Helper',
	cooldown: 10,
	limit: 3,
	status: 'enable',
	async run({ from, query, message }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Lh = useLocale(locale, 'helper');

		let capt = t(locale, 'helper.labels.searchTitle', [BOT_NAME]);
		const messages = await client.searchMessage(from, query);

		if (!messages.length) {
			capt += Lh.labels.noMessageFound;
		} else {
			capt += t(locale, 'helper.labels.foundMessages', [messages.length]);

			await client.reply(from, capt.trim(), message);

			for (const messageElement of messages) {
				await client.reply(from, L.info.foundIt, messageElement);
				await delay(200);
			}

			return;
		}

		await client.reply(from, capt.trim(), message);
	}
});
