import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'title',
	minifiedDescription: 'Group Title',
	description: 'Change the title of the group.',
	usage: '!title `<texts>`',
	aliases: ['subject', 'topic', 'name'],
	category: 'Moderation',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run({ isBotAdmin, from, query, bodyQuoted, message }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!isBotAdmin) {
			return await client.reply(from, L.errors.botNotAdmin, message);
		}

		const text = query || bodyQuoted;

		if (!text) {
			return await client.reply(from, L.errors.titleRequired, message);
		}

		await client.updateGroup(from, { action: 'subject', text });
	}
});
