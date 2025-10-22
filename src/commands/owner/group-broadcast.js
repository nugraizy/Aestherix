import { delay } from '../../utils/modules/index.js';

const check4Duplicate = (chats) => {
	if (!Array.isArray(chats)) {
		return [];
	}

	const newChatIds = [];

	for (const id of chats) {
		if (!newChatIds.includes(id) && id !== 'status@broadcast') {
			newChatIds.push(id);
		}
	}

	return newChatIds;
};

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'groupbc',
	minifiedDescription: 'Group Broadcast',
	description: 'Send Broadcast to all groups.',
	usage: '!groupbc `<texts>`',
	aliases: ['gcbc'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, query, message, sender }, client) {
		try {
			if (!query) {
				return await client.instance.reply(from, 'You must enter text', message);
			}

			const getGroups = await client.instance.groupFetchAllParticipating();
			const groups = Object.entries(getGroups)
				.slice(0)
				.map((entry) => entry[1]);
			const chats = check4Duplicate(groups.map((v) => v.id));
			let text = 'Group Broadcast'.formatHeaders();

			text += `\n\n${query.trim()}\n\n`;
			text += `\`\`\`Broadcast by @${sender.split('@')[0]}\`\`\``;

			for (const id of chats) {
				await delay(300);
				await client.instance.send(id, { text, mentions: [sender] });
			}
		} catch (err) {
			log(err);
			await client.instance.reply(from, err.stack, message);
		}
	}
};
