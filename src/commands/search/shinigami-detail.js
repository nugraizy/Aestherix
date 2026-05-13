import { cmdId } from '../../helper/modules/prefix.js';
import { Shinigami } from '../../utils/shinigami/index.js';

const shinigami = new Shinigami();

export default {
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
		if (!query) {
			return await client.reply(from, 'Please provide a manga ID.', message);
		}

		const wait = await client.waitMessage(from, 'Fetching detail...', message);

		try {
			const manga = await shinigami.getManga(query.trim());

			const lines = [
				`Title : ${manga.title}`,
				`Status : ${manga.status || 'n/a'}`,
				`Authors : ${manga.authors?.length ? manga.authors.join(', ') : 'n/a'}`,
				`Artists : ${manga.artists?.length ? manga.artists.join(', ') : 'n/a'}`,
				`Genres : ${manga.genres?.length ? manga.genres.join(', ') : 'n/a'}`
			];

			if (manga.description) {
				const trimmed = manga.description.length > 500 ? manga.description.slice(0, 500) + '...' : manga.description;

				lines.push('', `Synopsis :\n${trimmed}`);
			}

			lines.push(`\nURL : ${manga.url}`);

			const body = `${'Shinigami Detail'.formatHeaders()}\n\n${lines.join('\n').formatForm()}`;
			const builder = new client.TemplateBuilder.Native();

			builder
				.destination(from)
				.body(body)
				.footer('Powered by ' + __botName)
				.buttons(
					builder.button.reply({ display: '📖 Chapters', id: cmdId('sgch', manga.id, { prefix }) }),
					builder.button.reply({ display: '📕 Read', id: cmdId('sgread', manga.id, { prefix }) })
				);

			if (manga.poster) {
				builder.header('image', manga.poster);
			}

			await builder.send();
			await wait.update('Detail fetched.');
		} catch (error) {
			return await wait.update(`Error: ${error.message || 'Manga not found.'}`);
		}
	}
};
