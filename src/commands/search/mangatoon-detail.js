import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { BOT_NAME } from '../../core/constants.js';

import { cmdId } from '../../helper/modules/prefix.js';
import { mangatoon } from '../../utils/mangatoon/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'mangatoondetail',
	minifiedDescription: 'MangaToon Detail',
	description: 'Get detail of a manga on MangaToon.',
	usage: '!mangatoondetail `<id>`',
	aliases: ['mtdetail', 'mtinfo'],
	category: 'Search',
	cooldown: 5,
	limit: 5,
	status: 'enable',
	async run({ query, from, message, prefix }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return await client.reply(from, L.errors.mangaIdRequired, message);
		}

		const wait = await client.waitMessage(from, L.success.fetchingDetail, message);

		try {
			const manga = await mangatoon.getDetail(query.trim());

			if (manga.error) {
				return await wait.update(manga.error);
			}

			const lines = [
				`Title : ${manga.title}`,
				`Author : ${manga.author || 'n/a'}`,
				`Status : ${manga.status || 'n/a'}`,
				`Rating : ${manga.ratings ? `⭐ ${manga.ratings}` : 'n/a'}`,
				`Episodes : ${manga.totalEpisodes}`,
				`Views : ${manga.totalViews || 'n/a'}`,
				`Likes : ${manga.totalLikes || 'n/a'}`,
				`Comments : ${manga.totalComments || 'n/a'}`,
				`Genres : ${manga.genres?.length ? manga.genres.join(', ') : 'n/a'}`
			];

			if (manga.description) {
				const trimmed = manga.description.length > 500 ? manga.description.slice(0, 500) + '...' : manga.description;

				lines.push('', `Synopsis :\n${trimmed}`);
			}

			lines.push(`\nURL : ${manga.url}`);

			const body = `${'MangaToon Detail'.formatHeaders()}\n\n${lines.join('\n').formatForm()}`;
			const builder = new client.TemplateBuilder.Native();

			builder
				.destination(from)
				.body(body)
				.footer('Powered by ' + BOT_NAME)
				.buttons(builder.button.reply({ display: '📖 Chapters', id: cmdId('mtch', manga.id, { prefix }) }));

			if (manga.episodes?.[0]?.url) {
				builder.buttons(
					builder.button.reply({ display: '📕 Read Ch.1', id: cmdId('mtread', manga.episodes[0].url, { prefix }) })
				);
			}

			await builder.send();
			await wait.update('Detail fetched.');
		} catch (error) {
			return await wait.update(`Error: ${error.message || 'Manga not found.'}`);
		}
	}
});
