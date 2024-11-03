/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'retrieve',
	minifiedDescription: 'Retrieve Group URL',
	description: "Retrieve the group's invitation URL." /* eslint-disable-line */,
	usage: '!retrieve',
	aliases: ['invite', 'inv', 'link'],
	category: 'Moderation',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run({ isBotAdmin, from, message }, client) {
		if (!isBotAdmin) {
			return await client.instance.reply('Bot is not admin, Please promote admin before using moderation commands.', {
				from,
				quoted: message
			});
		}

		await client.instance.send(
			from,
			{
				text: `Succeeded to retrieve the group's invitation URL.\n\nhttps://chat.whatsapp.com/${
					(
						await client.instance.updateGroup(from, 'RETRIEVE')
					)[0]
				}`
			},
			{ quoted: message }
		);
	}
};
