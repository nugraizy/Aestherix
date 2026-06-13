import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { nickname } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'nickname',
	minifiedDescription: 'Search Nickname',
	description: 'Find nickname.',
	usage: '!nickname `<query>`',
	aliases: ['nickfind'],
	category: 'Search',
	cooldown: 2,
	limit: 3,
	status: 'enable',
	run: async ({ query, message, from }, client) => {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return client.reply(from, L.errors.noQuery, message);
		}

		const result = await nickname(query);

		if (result?.error) {
			client.reply(from, result.error, message);
		}

		client.reply(
			from,
			`${'Nickfinder'.formatHeaders()}

${result.join('\n').trim()}`,
			message
		);
	}
});
