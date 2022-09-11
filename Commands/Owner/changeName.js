/* global botNum */

export default {
	name: 'setname',
	description: "Set the bot's name" /* eslint-disable-line */,
	usage: '!setname <name>',
	aliases: ['setnick', 'nick', 'name'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ isOwner, from, query, message }, client) {
		if (!isOwner) {
			return await client[botNum].reply({ from, quoted: message }, 'You are not allowed to use this command');
		}

		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'You must provide a name to set');
		}

		if (typeof client[botNum].updateProfileName !== 'function') {
			return await client[botNum].reply(
				{ from, quoted: message },
				"Your current Baileys didn't support changing profile name, please update to latest commit of the Baileys." /* eslint-disable-line */,
			);
		}

		await client[botNum].updateProfileName(query);
	},
};
