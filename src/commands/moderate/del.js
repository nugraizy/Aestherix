import { S_WHATSAPP_NET } from '../../helper/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'delete',
	description: 'Delete people messages',
	usage: '!delete <reply chat>',
	aliases: ['del'],
	category: 'Moderation',
	cooldown: 8,
	limit: 4,
	status: 'enable',
	async run({ isOwner, isAdmin, from, mediaData, message, bodyQuoted, isBotAdmin, groupMetadata }, client) {
		if (!isAdmin && !isOwner) {
			return await client[botNum].reply('You are not admin. This commands is only for admins.', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		if (!bodyQuoted) {
			return await client[botNum].reply('You must reply to a message to delete it.', { from, quoted: message, groupMetadata });
		}

		if (!mediaData.participant.includes(`${botNum.split(':')[0]}${S_WHATSAPP_NET}`) && !isBotAdmin) {
			return await client[botNum].reply('You can not ask bot to delete people message when bot is not admin.', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		await client[botNum].send(
			from,
			{
				delete: {
					id: mediaData.stanzaId,
					participant: mediaData.participant,
					remoteJid: from,
					...(mediaData.participant.includes(`${botNum.split(':')[0]}${S_WHATSAPP_NET}`) ? { fromMe: true } : {})
				}
			},
			{ groupMetadata }
		);
	}
};
