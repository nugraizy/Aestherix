import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'leave',
	minifiedDescription: 'Leave Group',
	description: 'Make the bot leave the group.',
	usage: '!leave',
	aliases: ['out', 'bye'],
	category: 'Moderation',
	cooldown: 6,
	limit: 20,
	restrict: true,
	status: 'enable',
	async run({ from, message, isSuperOwner }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!isSuperOwner) {
			return await client.reply(from, L.errors.ownerSuperOnly, message);
		}

		const data = await client.reply(from, 'I will leave.', message);

		await client.groupLeave(from);
		await client.chatModify({ delete: true, lastMessages: [data] }, from);
	}
});
