/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'setbio',
	description: "Set the bot's bio" /* eslint-disable-line */,
	usage: '!setbio <bio>',
	aliases: ['setinfo'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ isOwner, from, query, message, groupMetadata }, client) {
		if (!isOwner) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'You are not allowed to use this command');
		}

		if (!query) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'You must provide a bio to set');
		}

		await client[botNum].setStatus(query);
	}
};
