import configuration from '../../helper/config/connect.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

const _regex = new RegExp(
	'https?://(?:[^/]+.)?pinterest.(?:com|fr|de|ch|jp|cl|ca|it|co.uk|nz|ru|com.au|at|pt|co.kr|es|com.mx|dk|ph|th|com.uy|co|nl|info|kr|ie|vn|com.vn|ec|mx|in|pe|co.at|hu|co.in|co.nz|id|com.ec|com.py|tw|be|uk|com.bo|com.pe)'
);

const _id = /\/?pin\/?([\d]+)/;

const getPinId = (url) => {
	if (_regex.test(url)) {
		const id = _id.exec(url);

		return `https://id.pinterest.com/pin/${id[1]}/`;
	}

	return fetch(url, {
		method: 'HEAD'
	});
};

export default defineCommand({
	name: 'setpin',
	minifiedDescription: 'Set Pinterest Bookmarks',
	description: 'Set the pinterest bookmarks for profile pictures interval.',
	category: 'Owner',
	usage: '!setpin `<url>`',
	aliases: [],
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, message, query }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return client.reply(from, L.errors.noQuery, message);
		}

		const pinId = getPinId(query);

		if (pinId instanceof Promise) {
			query = (await pinId).url;
		}

		configuration.pinterest.id = query;

		client.reply(from, L.simulate.pinterestUpdated, message);
	}
});
