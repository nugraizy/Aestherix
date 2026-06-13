import { getLocale, useLocale } from '../../helper/i18n/index.js';
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
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!bodyQuoted) {
			return await client.reply(from, L.errors.deleteReplyRequired, message);
		}

		const myJid = client.decodeJid(client.user.id);
		const participantJid = client.decodeJid(await client.resolveJid(mediaData.participant, 'jid'));

		if (!participantJid?.includes(myJid) && !isBotAdmin) {
			return await client.reply(from, L.errors.deleteNotAdmin, message);
		}

		await client.send(
			from,
			{
				delete: {
					id: mediaData.stanzaId,
					participant: mediaData.participant,
					remoteJid: from,
					...(participantJid.includes(myJid) ? { fromMe: true } : {})
				}
			},
			{}
		);
	}
});
