import { getLocale, useLocale, t } from '../../helper/i18n/index.js';
import { BOT_NAME } from '../../core/constants.js';

import { Cache } from '../../helper/modules/cache.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { randomChar } from '../../utils/modules/index.js';
import { shinigami } from '../../utils/shinigami/index.js';
import { defineCommand } from '../_define.js';


const searchSessions = new Cache();

const formatMangaCaption = (manga) => {
	const lines = [`Title : ${manga.title}`];

	if (manga.genres?.length) {
		lines.push(`Genres : ${manga.genres.join(', ')}`);
	}

	if (manga.status) {
		lines.push(`Status : ${manga.status}`);
	}

	if (manga.authors?.length) {
		lines.push(`Authors : ${manga.authors.join(', ')}`);
	}

	return lines.join('\n');
};

function sendResult(state, from, message, client, ctx) {
	const { items, currentIndex, sessionId } = state;
	const manga = items[currentIndex];
	const isLast = currentIndex + 1 >= items.length;
	const Ls = useLocale(ctx.locale, 'search');
	const body = `${Ls.titles.shinigamiSearch.formatHeaders()}\n\n${formatMangaCaption(manga).formatForm()}\n\n${t(ctx.locale, 'search.labels.resultOf', [currentIndex + 1, items.length])}\nID : ${manga.id}`;

	const builder = new client.TemplateBuilder.Native();

	builder
		.destination(from)
		.body(body)
		.footer(t(ctx.locale, 'common.core.footer.poweredBy', [BOT_NAME]));

	if (manga.poster) {
		builder.header('image', manga.poster);
	}

	if (!isLast) {
		builder.buttons(
			builder.button.reply({ display: Ls.buttons.chapters, id: cmdId('sgch', manga.id, ctx) }),
			builder.button.reply({ display: Ls.buttons.detail, id: cmdId('sgdetail', manga.id, ctx) }),
			builder.button.reply({ display: 'Next', id: cmdId('sg', 'next ' + sessionId, ctx) })
		);
	} else {
		builder.buttons(
			builder.button.reply({ display: Ls.buttons.chapters, id: cmdId('sgch', manga.id, ctx) }),
			builder.button.reply({ display: Ls.buttons.detail, id: cmdId('sgdetail', manga.id, ctx) })
		);
	}

	return builder.send();
}

export default defineCommand({
	name: 'shinigamisearch',
	minifiedDescription: 'Search Shinigami',
	description: 'Search manga/manhwa on Shinigami.',
	usage: '!shinigamisearch `<query>`',
	aliases: ['shinigami', 'sg', 'sgsearch'],
	category: 'Search',
	cooldown: 5,
	limit: 5,
	status: 'enable',
	async run({ query, from, message, prefix }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return await client.reply(from, L.errors.queryRequired, message);
		}

		if (query.startsWith('next ')) {
			const sessionId = query.slice(5);
			const cached = searchSessions.get(sessionId);

			if (!cached) {
				return await client.reply(from, L.errors.sessionExpired, message);
			}

			cached.currentIndex++;

			if (cached.currentIndex >= cached.items.length) {
				searchSessions.delete(sessionId);

				return await client.reply(from, L.info.noMoreResults, message);
			}

			return await sendResult(cached, from, message, client, { prefix, locale });
		}

		const wait = await client.waitMessage(from, L.success.searching, message);

		const result = await shinigami.search(query);

		if (!result.items.length) {
			return await wait.update(L.core.errors.noResultsTryDifferent);
		}

		const sessionId = randomChar('abcdefghijklmnopqrstuvwxyz0123456789', 8);
		const items = result.items.slice(0, 10);
		const state = { items, currentIndex: 0, sessionId };

		searchSessions.set(sessionId, state);

		await wait.update(t(locale, 'common.core.progress.foundResults', [result.items.length]));
		await sendResult(state, from, message, client, { prefix, locale });
	}
});
