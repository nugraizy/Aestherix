export default {
	name: 'leave',
	description: 'Leave the group',
	usage: '!leave',
	aliases: ['out', 'bye'],
	category: 'Moderation',
	cooldown: 6,
	limit: 20,
	restrict: true,
	status: 'enable',
	async run({ isAdmin, isOwner, from, isGroup, message, groupMetadata }, client) {
		if (!isGroup) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'This command only works in group.');
		}

		if (!isAdmin && !isOwner) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'You must be an admin to use this command.');
		}

		const data = await client[botNum].reply({ groupMetadata, from, quoted: message }, 'I will leave.');

		await client[botNum].groupLeave(from);
		await client[botNum].chatModify({ delete: true, lastMessages: [data] }, from);
	}
};
