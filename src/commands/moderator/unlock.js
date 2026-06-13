import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'unlock',
	minifiedDescription: 'Unlock Group',
	description: 'Unlock the group.',
	usage: '!unlock',
	aliases: ['unlocked', 'unlockgroup', 'unlockgroupchat'],
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

		if (!groupMetadata.announce) {
			return await client.reply(from, L.errors.groupUnlocked, message);
		}

		await client.updateGroup(from, { action: 'not_announcement' });
	}
});
