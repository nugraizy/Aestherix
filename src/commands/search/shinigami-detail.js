import { getLocale, useLocale, t } from '../../helper/i18n/index.js';
import { BOT_NAME } from '../../core/constants.js';

import { cmdId } from '../../helper/modules/prefix.js';
import { shinigami } from '../../utils/shinigami/index.js';
import { defineCommand } from '../_define.js';


export default defineCommand({
	name: 'shinigamidetail',
	minifiedDescription: 'Shinigami Detail',
	description: 'Get detail of a manga on Shinigami.',
	usage: '!shinigamidetail `<id>`',
	aliases: ['sgdetail', 'sginfo'],
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

		const Ls = useLocale(locale, 'search');

		try {
			const manga = await shinigami.getManga(query.trim());

			const lines = [
				`Title : ${manga.title}`,
				`Status : ${manga.status || 'n/a'}`,
				`${Ls.labels.authors} : ${manga.authors?.length ? manga.authors.join(', ') : 'n/a'}`,
				`Artists : ${manga.artists?.length ? manga.artists.join(', ') : 'n/a'}`,
				`${Ls.labels.genres} : ${manga.genres?.length ? manga.genres.join(', ') : 'n/a'}`
			];

			if (manga.description) {
				const trimmed = manga.description.length > 500 ? manga.description.slice(0, 500) + '...' : manga.description;

				lines.push('', `${Ls.labels.synopsis} :\n${trimmed}`);
			}

			lines.push(`\n${Ls.labels.url} : ${manga.url}`);

			const body = `${Ls.titles.shinigamiDetail.formatHeaders()}\n\n${lines.join('\n').formatForm()}`;
			const builder = new client.TemplateBuilder.Native();

			builder
				.destination(from)
				.body(body)
				.footer(t(locale, 'common.core.footer.poweredBy', [BOT_NAME]))
				.buttons(
					builder.button.reply({ display: Ls.buttons.chapters, id: cmdId('sgch', manga.id, { prefix }) }),
					builder.button.reply({ display: Ls.buttons.read, id: cmdId('sgread', manga.id, { prefix }) })
				);

			if (manga.poster) {
				builder.header('image', manga.poster);
			}

			await builder.send();
			await wait.update(L.core.errors.detailFetched);
		} catch (error) {
			return await wait.update(`Error: ${error.message || L.core.errors.mangaNotFound}`);
		}
	}
});
