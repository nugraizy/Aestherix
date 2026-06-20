import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'approverequest',
	minifiedDescription: 'Approve join requests',
	description: 'Approve pending join requests.',
	usage: '!approverequest `<@mention/reply>`',
	aliases: ['approve', 'acceptjoin'],
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
			return await client.reply(from, 'Please mention or reply to users to approve.', message);
		}

		try {
			const result = await client.groupRequestParticipantsUpdate(from, targets, 'approve');

			const approved = result.filter((r) => r.status === 'success');
			const failed = result.filter((r) => r.status !== 'success');

			let response = '';

			if (approved.length > 0) {
				response += `✅ Approved: ${approved.map((r) => `@${r.jid.split('@')[0]}`).join(', ')}`;
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
			await client.reply(from, `Failed to approve requests: ${error.message}`, message);
		}
	}
});
