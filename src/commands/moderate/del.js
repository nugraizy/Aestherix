import { defineCommand } from '../_define.js';

export default defineCommand({
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
			return await client.reply(from, 'You must reply to a message to delete it.', message);
		}

		const myJid = client.decodeJid(client.user.id);

		if (!mediaData.participant.includes(myJid) && !isBotAdmin) {
			return await client.reply(from, 'You can not ask bot to delete people message when bot is not admin.', message);
		}

		await client.send(
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
});
