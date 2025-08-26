/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'setname',
	minifiedDescription: 'Change Name',
	description: "Set the bot's name." /* eslint-disable-line */,
	usage: '!setname `<name>`',
	aliases: ['setnick', 'nick', 'name'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, query, message }, client) {
		if (!query) {
			return await client.instance.reply('You must provide a name to set', { from, quoted: message });
		}

		if (typeof client.instance.updateProfileName !== 'function') {
			return await client.instance.reply(
				"Your current Baileys didn't support changing profile name, please update to latest commit of the Baileys." /* eslint-disable-line */,
				{ from, quoted: message }
			);
		}

		await client.instance.updateProfileName(query);
	}
};
