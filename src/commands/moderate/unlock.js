export default {
	name: 'unlock',
	description: 'Unlock the group.',
	usage: '!unlock',
	aliases: ['unlocked', 'unlockgroup', 'unlockgroupchat'],
	category: 'Moderation',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run({ groupMetadata, isAdmin, isBotAdmin, isOwner, from, message }, client) {
		if (!isAdmin && !isOwner) {
			return await client[botNum].reply(
				{ groupMetadata, from, quoted: message },
				'You are not admin. This commands is only for admins.'
			);
		}

		if (!isBotAdmin) {
			return await client[botNum].reply(
				{ groupMetadata, from, quoted: message },
				'Bot is not admin, Please promote admin before using moderation commands.'
			);
		}

		if (!groupMetadata.announce) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'Group is already unlocked.');
		}

		await client[botNum].updateGroup(from, undefined, 'NOT_ANNOUNCEMENT');
	}
};
