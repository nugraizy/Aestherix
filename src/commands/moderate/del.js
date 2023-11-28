import { S_WHATSAPP_NET } from '../../helper/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'delete',
	minifiedDescription: 'Delete Message',
	description: 'Delete people messages',
	usage: '!delete <reply chat>',
	aliases: ['del'],
	category: 'Moderation',
	cooldown: 8,
	limit: 4,
	status: 'enable',
	async run({ from, mediaData, message, bodyQuoted, isBotAdmin, groupMetadata }, client) {
		if (!bodyQuoted) {
			return await client.instance.reply('You must reply to a message to delete it.', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		if (!mediaData.participant.includes(`${instance.split(':')[0]}${S_WHATSAPP_NET}`) && !isBotAdmin) {
			return await client.instance.reply('You can not ask bot to delete people message when bot is not admin.', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		await client.instance.send(
			from,
			{
				delete: {
					id: mediaData.stanzaId,
					participant: mediaData.participant,
					remoteJid: from,
					...(mediaData.participant.includes(`${instance.split(':')[0]}${S_WHATSAPP_NET}`) ? { fromMe: true } : {})
				}
			},
			{ groupMetadata }
		);
	}
};
