/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'setname',
	description: "Set the bot's name" /* eslint-disable-line */,
	usage: '!setname <name>',
	aliases: ['setnick', 'nick', 'name'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ isOwner, from, query, message, groupMetadata }, client) {
		if (!isOwner) {
			return await client[botNum].reply('You are not allowed to use this command', { from, quoted: message, groupMetadata });
		}

		if (!query) {
			return await client[botNum].reply('You must provide a name to set', { from, quoted: message, groupMetadata });
		}

		if (typeof client[botNum].updateProfileName !== 'function') {
			return await client[botNum].reply(
				"Your current Baileys didn't support changing profile name, please update to latest commit of the Baileys." /* eslint-disable-line */,
				{ from, quoted: message, groupMetadata }
			);
		}

		await client[botNum].updateProfileName(query);
	}
};
