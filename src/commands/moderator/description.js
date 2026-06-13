import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'description',
	minifiedDescription: 'Change Description',
	description: 'Change the description of the group.',
	usage: '!description `<texts>`',
	aliases: ['desc'],
	category: 'Moderation',
	cooldown: 4,
	limit: 2,
	status: 'enable',
	async run({ isBotAdmin, query, bodyQuoted, from, message }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!isBotAdmin) {
			return await client.reply(from, L.errors.botNotAdmin, message);
		}

		const text = query || bodyQuoted;

		if (!text) {
			return await client.reply(from, L.errors.descriptionRequired, message);
		}

		await client.updateGroup(from, { action: 'description', text });
	}
});
