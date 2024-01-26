/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'grouptag',
	description: 'Tag everyone in the group with the new messages protocol',
	usage: '!grouptag',
	aliases: ['gctag'],
	category: 'Debugging',
	cooldown: 0,
	limit: 20,
	status: 'enable',
	run: async ({ from, query, groupMetadata }, client) => {
		return await client.instance.send(from, {
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
};
