import { getLocale, useLocale, t } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'retrieve',
	minifiedDescription: 'Retrieve Group URL',
	description: "Retrieve the group's invitation URL.",
	usage: '!retrieve',
	aliases: ['inv', 'link'],
	category: 'Moderation',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run({ isBotAdmin, from, message }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!isBotAdmin) {
			return await client.reply(from, L.errors.botNotAdmin, message);
		}

		const [code] = await client.updateGroup(from, { action: 'retrieve' });

		await client.send(from, { text: `https://chat.whatsapp.com/${code}` }, { quoted: message });
	}
});
