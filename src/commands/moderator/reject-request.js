import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'rejectrequest',
	minifiedDescription: 'Reject join requests',
	description: 'Reject pending join requests.',
	usage: '!rejectrequest `<@mention/reply>`',
	aliases: ['reject', 'denyjoin'],
	category: 'Moderation',
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ isBotAdmin, from, message, mention, bodyQuoted, mediaData, isGroup }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!isGroup) {
			return await client.reply(from, L.errors.groupOnly, message);
		}

		if (!isBotAdmin) {
			return await client.reply(from, L.errors.botNotAdmin, message);
		}

		let targets = [];

		if (mention && mention.length > 0) {
			targets = mention;
		} else if (bodyQuoted && mediaData?.participant) {
			targets = [mediaData.participant];
		}

		if (targets.length === 0) {
			return await client.reply(from, 'Please mention or reply to users to reject.', message);
		}

		try {
			const result = await client.groupRequestParticipantsUpdate(from, targets, 'reject');

			const rejected = result.filter((r) => r.status === 'success');
			const failed = result.filter((r) => r.status !== 'success');

			let response = '';

			if (rejected.length > 0) {
				response += `✅ Rejected: ${rejected.map((r) => `@${r.jid.split('@')[0]}`).join(', ')}`;
			}

			if (failed.length > 0) {
				response += `\n❌ Failed: ${failed.map((r) => `@${r.jid.split('@')[0]} (${r.status})`).join(', ')}`;
			}

			await client.send(
				from,
				{
					text: response,
					mentions: targets
				},
				{ quoted: message }
			);
		} catch (error) {
			await client.reply(from, `Failed to reject requests: ${error.message}`, message);
		}
	}
});
