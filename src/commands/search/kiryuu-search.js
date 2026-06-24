import { getLocale, useLocale, t } from '../../helper/i18n/index.js';
import { BOT_NAME } from '../../core/constants.js';

import { Cache } from '../../helper/modules/cache.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { kiryuu } from '../../utils/index.js';
import { randomChar } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';


const searchSessions = new Cache();

/**
 * @param {import('../../utils/kiryuu/types/kiryuu').KiryuuManga} manga
 * @returns {string}
 */
const formatMangaCaption = (manga) => {
	const lines = [
		`Title : ${manga.title}`,
		`Type : ${manga.type || 'n/a'}`,
		`Status : ${manga.status || 'n/a'}`,
		`Authors : ${manga.authors.length ? manga.authors.join(', ') : 'n/a'}`,
		`Artists : ${manga.artists.length ? manga.artists.join(', ') : 'n/a'}`,
		`Genres : ${manga.genres.length ? manga.genres.join(', ') : 'n/a'}`
	];

	if (manga.altTitles?.length) {
		lines.push(`Alt Titles : ${manga.altTitles.slice(0, 3).join(', ')}`);
	}

	return lines.join('\n');
};

function sendResult(state, from, message, client, ctx) {
	const { items, currentIndex, sessionId } = state;
	const manga = items[currentIndex];
	const caption = formatMangaCaption(manga);
	const isLast = currentIndex + 1 >= items.length;
	const Ls = useLocale(ctx.locale, 'search');
	const body = `${Ls.titles.kiryuuSearch.formatHeaders()}\n\n${caption.formatForm()}\n\n${t(ctx.locale, 'search.labels.resultOf', [currentIndex + 1, items.length])}\nSlug : ${manga.slug}`;

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
			builder.button.reply({ display: Ls.buttons.chapters, id: cmdId('kych', manga.slug, ctx) }),
			builder.button.reply({ display: Ls.buttons.detail, id: cmdId('kydetail', manga.slug, ctx) }),
			builder.button.reply({ display: Ls.buttons.moreChapters || 'Next', id: cmdId('ky', 'next ' + sessionId, ctx) })
		);
	} else {
		builder.buttons(
			builder.button.reply({ display: Ls.buttons.chapters, id: cmdId('kych', manga.slug, ctx) }),
			builder.button.reply({ display: Ls.buttons.detail, id: cmdId('kydetail', manga.slug, ctx) })
		);
	}

	return builder.send();
}

export default defineCommand({
	name: 'kiryuusearch',
	minifiedDescription: 'Search Kiryuu',
	description: 'Search manga, manhwa, or manhua on Kiryuu.',
	usage: '!kiryuusearch `<query>`',
	aliases: ['ky', 'kysearch', 'kiryuu'],
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

		const result = await kiryuu.searchManga(query, { limit: 10 });

		if (!result?.length) {
			return await wait.update(Ls.labels.noResults);
		}

		const sessionId = randomChar('abcdefghijklmnopqrstuvwxyz0123456789', 8);
		const state = { items: result, currentIndex: 0, sessionId };

		searchSessions.set(sessionId, state);

		await wait.update(t(locale, 'search.labels.foundResults', [result.length]));
		await sendResult(state, from, message, client, { prefix, locale });
	}
});
