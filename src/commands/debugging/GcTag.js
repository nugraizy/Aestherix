import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'grouptag',
	description: 'Tag everyone in the group with the new messages protocol',
	usage: '!grouptag',
	aliases: ['gctag'],
	category: 'Debugging',
	cooldown: 0,
	limit: 20,
	status: 'enable',
	run: async ({ from, query, groupMetadata }, client) => {
		return await client.send(from, {
			text: `@${from}`,
			contextInfo: {
				mentionedJid: groupMetadata.participantsGroup,
				groupMentions: [
					{
						groupJid: from,
						groupSubject: query || groupMetadata.subject
					}
				]
			}
		});
	}
});
