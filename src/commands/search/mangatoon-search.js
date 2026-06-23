import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { BOT_NAME } from '../../core/constants.js';

import { Cache } from '../../helper/modules/cache.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { randomChar } from '../../utils/modules/index.js';
import { mangatoon } from '../../utils/mangatoon/index.js';
import { defineCommand } from '../_define.js';

const searchSessions = new Cache();

const formatMangaCaption = (manga) => {
	const lines = [`Title : ${manga.title}`];

	if (manga.genres?.length) {
		lines.push(`Genres : ${manga.genres.join(', ')}`);
	}

	return lines.join('\n');
};

function sendResult(state, from, message, client, ctx) {
	const { items, currentIndex, sessionId } = state;
	const manga = items[currentIndex];
	const isLast = currentIndex + 1 >= items.length;
	const Ls = useLocale(ctx.locale, 'search');
	const body = `${Ls.titles.mangatoonSearch.formatHeaders()}\n\n${formatMangaCaption(manga).formatForm()}\n\n${Ls.labels.resultOf.replace('{0}', currentIndex + 1).replace('{1}', items.length)}\nID : ${manga.id}`;

	const builder = new client.TemplateBuilder.Native();

	builder
		.destination(from)
		.body(body)
		.footer('Powered by ' + BOT_NAME);

	if (manga.poster) {
		builder.header('image', manga.poster);
	}

	if (!isLast) {
		builder.buttons(
			builder.button.reply({ display: Ls.buttons.detail, id: cmdId('mtdetail', manga.id, ctx) }),
			builder.button.reply({ display: Ls.buttons.chapters, id: cmdId('mtch', manga.id, ctx) }),
			builder.button.reply({ display: 'Next', id: cmdId('mt', 'next ' + sessionId, ctx) })
		);
	} else {
		builder.buttons(
			builder.button.reply({ display: Ls.buttons.detail, id: cmdId('mtdetail', manga.id, ctx) }),
			builder.button.reply({ display: Ls.buttons.chapters, id: cmdId('mtch', manga.id, ctx) })
		);
	}

	return builder.send();
}

export default defineCommand({
	name: 'mangatoonsearch',
	minifiedDescription: 'Search MangaToon',
	description: 'Search manga/manhua on MangaToon.',
	usage: '!mangatoonsearch `<query>`',
	aliases: ['mangatoon', 'mt', 'mtsearch'],
	category: 'Search',
	cooldown: 5,
	limit: 5,
	status: 'enable',
	async run({ query, from, message, prefix }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Ls = useLocale(locale, 'search');

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

		const result = await mangatoon.search(query);

		if (result.error) {
			return await wait.update(result.error);
		}

		if (!result.items.length) {
			return await wait.update(Ls.labels.noResults);
		}

		const sessionId = randomChar('abcdefghijklmnopqrstuvwxyz0123456789', 8);
		const items = result.items.slice(0, 10);
		const state = { items, currentIndex: 0, sessionId };

		searchSessions.set(sessionId, state);

		await wait.update(Ls.labels.foundResults.replace('{0}', result.items.length));
		await sendResult(state, from, message, client, { prefix, locale });
	}
});
