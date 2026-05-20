import { cmdId } from '../../helper/modules/prefix.js';
import { Atsumaru } from '../../utils/atsumaru/index.js';
import { defineCommand } from '../_define.js';

const atsumaru = new Atsumaru();

const formatDetailCaption = (manga) => {
	const lines = [
		`Title : ${manga.title}`,
		`Type : ${manga.type || 'n/a'}`,
		`Status : ${manga.status || 'n/a'}`,
		`Rating : ${manga.rating ? `⭐ ${manga.rating.toFixed(1)}/10` : 'n/a'}`,
		`Authors : ${manga.authors.length ? manga.authors.join(', ') : 'n/a'}`,
		`Artists : ${manga.artists.length ? manga.artists.join(', ') : 'n/a'}`,
		`Genres : ${manga.genres.length ? manga.genres.join(', ') : 'n/a'}`
	];

	if (manga.otherNames?.length) {
		lines.push(`Alt Titles : ${manga.otherNames.slice(0, 5).join(', ')}`);
	}

	lines.push('');

	if (manga.synopsis) {
		const trimmed = manga.synopsis.length > 500 ? manga.synopsis.slice(0, 500) + '...' : manga.synopsis;

		lines.push(`Synopsis :\n${trimmed}`);
	}

	lines.push(`\nURL : ${manga.url}`);

	return lines.join('\n');
};

export default defineCommand({
	name: 'atsumarudetail',
	minifiedDescription: 'Atsumaru Detail',
	description: 'Get detail of a manga on Atsumaru.',
	usage: '!atsumarudetail `<id>`',
	aliases: ['atdetail', 'atinfo'],
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
			const manga = await atsumaru.getManga(query.trim());
			const caption = formatDetailCaption(manga);
			const body = `${'Atsumaru Detail'.formatHeaders()}\n\n${caption.formatForm()}`;

			const builder = new client.TemplateBuilder.Native();

			builder
				.destination(from)
				.body(body)
				.footer('Powered by ' + __botName)
				.buttons(
					builder.button.reply({ display: '📖 Chapters', id: cmdId('atch', manga.id, { prefix }) }),
					builder.button.reply({ display: '📕 Read', id: cmdId('atread', manga.id, { prefix }) })
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
});
