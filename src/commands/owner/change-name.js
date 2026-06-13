import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'setname',
	minifiedDescription: 'Change Name',
	description: "Set the bot's name."  ,
	usage: '!setname `<name>`',
	aliases: ['setnick', 'nick', 'name'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, query, message }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return await client.reply(from, L.errors.nameRequired, message);
		}

		if (typeof client.updateProfileName !== 'function') {
			return await client.reply(
				from,
				"Your current Baileys didn't support changing profile name, please update to latest commit of the Baileys."  ,
				message
			);
		}

		await client.updateProfileName(query);
	}
});
