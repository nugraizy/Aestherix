import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

const ADD_MODES = {
	all: 'all_member_add',
	everyone: 'all_member_add',
	admin: 'admin_add',
	admins: 'admin_add'
};

export default defineCommand({
	name: 'addmode',
	minifiedDescription: 'Change add mode',
	description: 'Change who can add members to the group.',
	usage: '!addmode `<all/admin>`',
	aliases: ['addsetting'],
	category: 'Moderation',
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ isBotAdmin, from, message, args, isGroup }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!isGroup) {
			return await client.reply(from, L.errors.groupOnly, message);
		}

		if (!isBotAdmin) {
			return await client.reply(from, L.errors.botNotAdmin, message);
		}

		const mode = args[1]?.toLowerCase();

		if (!mode || !ADD_MODES.hasOwnProperty(mode)) {
			return await client.reply(
				from,
				'Usage: !addmode `<all/admin>`\n\nOptions:\n• all - All members can add\n• admin - Only admins can add',
				message
			);
		}

		try {
			const addMode = ADD_MODES[mode];

			await client.groupMemberAddMode(from, addMode);

			if (addMode === 'all_member_add') {
				await client.reply(from, 'All members can now add new members.', message);
			} else {
				await client.reply(from, 'Only admins can now add new members.', message);
			}
		} catch (error) {
			await client.reply(from, `Failed to change add mode: ${error.message}`, message);
		}
	}
});
