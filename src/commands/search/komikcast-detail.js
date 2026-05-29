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
		if (!query) {
			return await client.reply(from, 'Please provide a comic slug.', message);
		}

		const wait = await client.waitMessage(from, 'Fetching detail...', message);

		try {
			const manga = await komikcast.getManga(query.trim());

			const lines = [
				`Title : ${manga.title}`,
				`Status : ${manga.status || 'n/a'}`,
				`Authors : ${manga.authors?.length ? manga.authors.join(', ') : 'n/a'}`,
				`Genres : ${manga.genres?.length ? manga.genres.join(', ') : 'n/a'}`
			];

			if (manga.synopsis) {
				const trimmed = manga.synopsis.length > 500 ? manga.synopsis.slice(0, 500) + '...' : manga.synopsis;

				lines.push('', `Synopsis :\n${trimmed}`);
			}

			lines.push(`\nURL : ${manga.url}`);

			const body = `${'Komikcast Detail'.formatHeaders()}\n\n${lines.join('\n').formatForm()}`;
			const builder = new client.TemplateBuilder.Native();

			builder
				.destination(from)
				.body(body)
				.footer('Powered by ' + BOT_NAME)
				.buttons(
					builder.button.reply({ display: '📖 Chapters', id: cmdId('kcch', manga.slug, { prefix }) }),
					builder.button.reply({ display: '📕 Read', id: cmdId('kcread', manga.slug, { prefix }) })
				);

			if (manga.poster) {
				builder.header('image', manga.poster);
			}

			await builder.send();
			await wait.update('Detail fetched.');
		} catch (error) {
			return await wait.update(`Error: ${error.message || 'Comic not found.'}`);
		}
	}
});
