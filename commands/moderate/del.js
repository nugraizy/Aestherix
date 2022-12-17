/* global botNum */
import { S_WHATSAPP_NET } from '../../helper/index.js';

export default {
	name: 'delete',
	description: 'Delete people messages',
	usage: '!delete <reply chat>',
	aliases: ['del'],
	category: 'Moderation',
	cooldown: 8,
	limit: 4,
	status: 'enable',
	async run({ isOwner, isAdmin, from, mediaData, message, bodyQuoted, isBotAdmin }, client) {
		if (!isAdmin && !isOwner) {
			return await client[botNum].reply({ from, quoted: message }, 'You are not admin. This commands is only for admins.');
		}

		if (!bodyQuoted) {
			return await client[botNum].reply({ from, quoted: message }, 'You must reply to a message to delete it.');
		}

		if (!mediaData.participant.includes(`${botNum.split(':')[0]}${S_WHATSAPP_NET}`) && !isBotAdmin) {
			return await client[botNum].reply(
				{ from, quoted: message },
				'You can not ask bot to delete people message when bot is not admin.',
			);
		}

		await client[botNum].sendMessage(from, {
			delete: {
				id: mediaData.stanzaId,
				participant: mediaData.participant,
				remoteJid: from,
				...(mediaData.participant.includes(`${botNum.split(':')[0]}${S_WHATSAPP_NET}`) ? { fromMe: true } : {}),
			},
		});
	},
};
