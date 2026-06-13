import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'unrestrict',
	minifiedDescription: 'Unrestrict Group',
	description: 'Unrestrict the group.',
	usage: '!unrestrict',
	aliases: ['unrestrict', 'unrestrictgroup', 'unrestrictgroupchat'],
	category: 'Moderation',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run({ isBotAdmin, from, message, groupMetadata }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!isBotAdmin) {
			return await client.reply(from, L.errors.botNotAdmin, message);
		}

		if (!groupMetadata.restrict) {
			return await client.reply(from, L.errors.groupUnrestricted, message);
		}

		await client.updateGroup(from, { action: 'unlocked' });
	}
});
