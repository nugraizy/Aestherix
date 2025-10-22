/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'delete',
	minifiedDescription: 'Delete Message',
	description: 'Delete people messages',
	usage: '!delete `<reply chat>`',
	aliases: ['del'],
	category: 'Moderation',
	cooldown: 8,
	limit: 4,
	status: 'enable',
	async run({ from, mediaData, message, bodyQuoted, isBotAdmin }, client) {
		if (!bodyQuoted) {
			return await client.instance.reply(from, 'You must reply to a message to delete it.', message);
		}

		const myJid = client.instance.decodeJid(instance);

		if (!mediaData.participant.includes(myJid) && !isBotAdmin) {
			return await client.instance.reply(from, 'You can not ask bot to delete people message when bot is not admin.', message);
		}

		await client.instance.send(
			from,
			{
				delete: {
					id: mediaData.stanzaId,
					participant: mediaData.participant,
					remoteJid: from,
					...(mediaData.participant.includes(myJid) ? { fromMe: true } : {})
				}
			},
			{}
		);
	}
};
