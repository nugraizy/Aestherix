import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { skip } from '../../utils/anonymous/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'skip',
	minifiedDescription: 'Anonymous Skip',
	description: 'Skip a partner',
	category: 'Anonymous',
	usage: '!skip',
	aliases: ['skippartner'],
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ from, message }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		const result = skip(from, 20, client, message);

		if (!result) {
			return await client.reply(from, L.errors.notInSearch, message);
		}

		if (result.partner2) {
			await client.reply(from, L.info.skippedPartner, message);
			await client.send(result.partner2, { text: L.info.partnerSkipped }, {});
			return;
		}

		await client.reply(from, `${L.errors.alreadySearching}\nPlease wait for ${result.seconds}s`, message);
	}
});
