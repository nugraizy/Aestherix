import { getLocale, useLocale, t } from '../../helper/i18n/index.js';
import { BOT_NAME } from '../../core/constants.js';

import { cmdId } from '../../helper/modules/prefix.js';
import { komikcast } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'komikcastdetail',
	minifiedDescription: 'Komikcast Detail',
	description: 'Get detail of a comic on Komikcast.',
	usage: '!komikcastdetail `<slug>`',
	aliases: ['kcdetail', 'kcinfo'],
	category: 'Search',
	cooldown: 5,
	limit: 5,
	status: 'enable',
	async run({ query, from, message, prefix }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return await client.reply(from, L.errors.comicSlugRequired, message);
		}

		const wait = await client.waitMessage(from, L.success.fetchingDetail, message);

		const Ls = useLocale(locale, 'search');

		try {
			const manga = await komikcast.getManga(query.trim());

			const lines = [
				`Title : ${manga.title}`,
				`Status : ${manga.status || 'n/a'}`,
				`${Ls.labels.authors} : ${manga.authors?.length ? manga.authors.join(', ') : 'n/a'}`,
				`${Ls.labels.genres} : ${manga.genres?.length ? manga.genres.join(', ') : 'n/a'}`
			];

			if (manga.synopsis) {
				const trimmed = manga.synopsis.length > 500 ? manga.synopsis.slice(0, 500) + '...' : manga.synopsis;

				lines.push('', `${Ls.labels.synopsis} :\n${trimmed}`);
			}

			lines.push(`\n${Ls.labels.url} : ${manga.url}`);

			const body = `${Ls.titles.komikcastDetail.formatHeaders()}\n\n${lines.join('\n').formatForm()}`;
			const builder = new client.TemplateBuilder.Native();

			builder
				.destination(from)
				.body(body)
				.footer(t(locale, 'common.core.footer.poweredBy', [BOT_NAME]))
				.buttons(
					builder.button.reply({ display: Ls.buttons.chapters, id: cmdId('kcch', manga.slug, { prefix }) }),
					builder.button.reply({ display: Ls.buttons.read, id: cmdId('kcread', manga.slug, { prefix }) })
				);

			if (manga.poster) {
				builder.header('image', manga.poster);
			}

			await builder.send();
			await wait.update(L.core.errors.detailFetched);
		} catch (error) {
			return await wait.update(`Error: ${error.message || L.core.errors.comicNotFound}`);
		}
	}
});
