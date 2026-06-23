import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { color, delay, loggers } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

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

export default defineCommand({
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
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Lo = useLocale(locale, 'owner');

		try {
			if (!query) {
				return await client.reply(from, L.errors.textRequired, message);
			}

			const getGroups = await client.groupFetchAllParticipating();
			const groups = Object.entries(getGroups)
				.slice(0)
				.map((entry) => entry[1]);
			const chats = check4Duplicate(groups.map((v) => v.id));
			let text = Lo.titles.groupBroadcast.formatHeaders();

			text += `\n\n${query.trim()}\n\n`;
			text += `\`\`\`${t(locale, 'owner.labels.broadcastBy', [sender.split('@')[0]])}\`\`\``;

			for (const id of chats) {
				await delay(300);
				await client.send(id, { text, mentions: [sender] });
			}
		} catch (err) {
			loggers.error(color('Group broadcast failed:', 'red'), err);
			await client.reply(from, err.stack, message);
		}
	}
});
