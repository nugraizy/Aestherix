const regex = (input) => {
	const regex = /^(?:https?:\/\/)?(?:chat\.)?(?:whatsapp\.com)\/([\d\w]{21,23})/;

	if (!regex.test(input)) {
		return false;
	}

	const match = regex.exec(input);

	if (match) {
		return match[1];
	}

	return false;
};

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'join',
	minifiedDescription: 'Invite Bot',
	description: 'Ask bot to join your group.',
	usage: '!join `<url>`',
	aliases: ['j'],
	category: 'Helper',
	limit: 7,
	cooldown: 5,
	status: 'enable',
	async run({ from, query, message, sender, isOwner, settings }, client) {
		if (!query) {
			return await client.instance.reply(from, 'You must provide a url.', message);
		}

		const groups = await client.instance.groupFetchAllParticipating();

		const isGroupMaxed = Object.keys(groups).length > settings.max_group;
		const reg = regex(query);

		if (isGroupMaxed && !isOwner) {
			return await client.instance.reply(from, 'Bot already maxed the group.', message);
		}

		if (!reg) {
			return await client.instance.reply(from, 'Invalid url.', message);
		}

		const metadataInvite = await client.instance.groupGetInviteInfo(reg).catch(() => null);

		if (Object.keys(groups).includes(metadataInvite.id)) {
			await client.instance.reply(from, 'I am already in this group.', message);
		} else if (!isOwner && metadataInvite.size >= 1024) {
			await client.instance.reply(from, 'Bot cannot join. Reason : Group is full.', message);
		} else if (!isOwner && metadataInvite.size < settings.min_members) {
			await client.instance.reply(
				from,
				`This group is not big enough to join. Minimum ${settings.min_members} participants.`,
				message
			);
		} else if (
			!isOwner &&
			!metadataInvite.participants
				?.filter((v) => v.admin)
				.map((v) => v.id)
				?.includes(sender)
		) {
			await client.instance.reply(from, 'You must be an admin to invite bot to group.', message);
		} else if (metadataInvite) {
			await client.instance.groupAcceptInvite(reg);
			await client.instance.reply(from, 'I am joining this group.', message);
			await client.instance.send(metadataInvite.id, {
				text: `@${sender.split('@')[0]} has invited me to the group. Tysm.`,
				mentions: [sender]
			});
			await client.instance.send(
				from,
				{
					text: 'Click to open menu',
					footer: 'Powered by Hidden Finder',
					buttons: [{ buttonId: '.menu', buttonText: { displayText: 'Menu' }, type: 1 }],
					headerType: 1
				},
				{}
			);
		}
	}
};
