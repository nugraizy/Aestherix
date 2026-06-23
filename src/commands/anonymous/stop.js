import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { stop } from '../../utils/anonymous/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'stop',
	minifiedDescription: 'Anonymous Stop',
	description: 'Stop a partner',
	category: 'Anonymous',
	usage: '!stop',
	aliases: ['stoppartner'],
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ from, message, sender }, client) {
		const locale = await getLocale(from, sender);
		const L = useLocale(locale, 'common');

		const result = stop(from, client);

		if (!result) {
			return await client.reply(from, L.errors.notInSearch, message);
		}

		if (result.partner2) {
			await client.reply(from, L.info.stoppedChat, message);
			await client.send(result.partner2, { text: L.info.partnerStopped }, {});
			return;
		}

		await client.reply(from, t(locale, 'common.errors.alreadySearching', [result.seconds]), message);
	}
});
