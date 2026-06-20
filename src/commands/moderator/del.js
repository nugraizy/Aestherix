import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { moderationAudit } from '../../helper/moderation-audit.js';
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
	async run({ from, sender, mediaData, message, bodyQuoted, isBotAdmin }, client) {
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

		moderationAudit.log({
			group: from,
			moderator: sender,
			action: 'delete',
			target: mediaData.participant || 'unknown'
		});

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
