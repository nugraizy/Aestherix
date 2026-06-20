import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'requests',
	minifiedDescription: 'List join requests',
	description: 'List pending join requests for the group.',
	usage: '!requests',
	aliases: ['joinrequests', 'pending'],
	category: 'Moderation',
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ isBotAdmin, from, message, isGroup }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!isGroup) {
			return await client.reply(from, L.errors.groupOnly, message);
		}

		if (!isBotAdmin) {
			return await client.reply(from, L.errors.botNotAdmin, message);
		}

		try {
			const requests = await client.groupRequestParticipantsList(from);

			if (!requests || requests.length === 0) {
				return await client.reply(from, 'No pending join requests.', message);
			}

			const list = requests
				.map((r, i) => `${i + 1}. @${r.jid.split('@')[0]} (${r.status || 'pending'})`)
				.join('\n');

			await client.send(
				from,
				{
					text: `*Pending Join Requests*\n\n${list}\n\nTotal: ${requests.length}`,
					mentions: requests.map((r) => r.jid)
				},
				{ quoted: message }
			);
		} catch (error) {
			await client.reply(from, `Failed to get requests: ${error.message}`, message);
		}
	}
});
