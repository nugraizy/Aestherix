import { getLocale, useLocale, t } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'hidetag',
	minifiedDescription: 'Hide tag',
	description: 'Hide tag everyone in the group.',
	usage: '!hidetag `<?query>`',
	aliases: ['tag', 'h'],
	category: 'Moderation',
	cooldown: 10,
	limit: 5,
	restrict: true,
	status: 'enable',
	async run({ isAdmin, isOwner, from, query, bodyQuoted, participantsGroup, isGroup, message }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!isGroup) {
			return await client.reply(from, L.errors.groupOnly, message);
		}

		if (!isAdmin && !isOwner) {
			return await client.reply(from, L.errors.adminOnly, message);
		}

		await client.send(from, { text: query || bodyQuoted || ':)', mentions: participantsGroup }, {});
	}
});
