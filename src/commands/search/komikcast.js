import { KomikCast, mime } from '../../utils/index.js';

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'komikcast',
	description: 'Search Comic from Komikcast.net',
	usage: '!komikcast <query>',
	aliases: ['komik', 'comic', 'manga'],
	category: 'Search',
	cooldown: 7,
	limit: 7,
	status: 'enable',
	run: async ({ query, from, message, type, args, sender, groupMetadata }, client) => {
		if (!query) {
			return client[botNum].reply({ groupMetadata, from, quoted: message }, 'You must provide a query.');
		}

		const komik = new KomikCast();

		if (args[2] === 'detail' && type === 'listResponseMessage') {
			const { altTitle, onGoing, comicType, releaseDate, serialize, views, thumbnail, authorStr, artistsStr, chapters } =
				await komik.getDetails(args[1]);
			const caption = `${'Komikcast'.formatHeaders()}
			
Title : ${altTitle}
Author : ${authorStr}
Artists : ${artistsStr}
On Going : ${onGoing ? 'Yes' : 'No'}
Comic Type : ${comicType}
Release Year : ${releaseDate}
Serialization : ${serialize}
Views : ${views}
Tot. Chapters : ${chapters.length}`;

			await client[botNum].send(from, { image: { url: thumbnail }, caption }, { groupMetadata, quoted: message });

			const row = [];

			chapters.forEach((v, i) =>
				row.push({ rows: [{ title: `Chapter ${i + 1}`, rowId: `.komikcast ${v} extract ${altTitle}` }], title: '\t' })
			);

			await client[botNum].send(
				from,
				{
					buttonText: 'Open list',
					title: 'See chapters',
					footer: 'Made by Void Bot. Powered by Hidden Finder',
					text: '\t',
					sections: row
				},
				{ groupMetadata }
			);
			return;
		} else if (args[2] === 'extract' && type === 'listResponseMessage') {
			const pages = await komik.getPanel(args[1]);

			const buffer = await komik.toPdf(pages, sender);

			await client[botNum].send(
				from,
				{
					document: Buffer.from(buffer, 'base64'),
					mimetype: mime('pdf'),
					fileName: args.slice(3).join('')
				},
				{ groupMetadata }
			);

			return;
		}

		const result = await komik.search(query);

		if ('error' in result) {
			return client[botNum].reply({ groupMetadata, from, quoted: message }, result.error);
		}

		const row = [];

		result.forEach(({ name, source }) =>
			row.push({ rows: [{ title: `${name}`, rowId: `.komikcast ${source} detail` }], title: '\t' })
		);

		await client[botNum].send(
			from,
			{
				buttonText: 'Open list',
				title: 'See result',
				footer: 'Made by Void Bot. Powered by Hidden Finder',
				text: '\t',
				sections: row
			},
			{ groupMetadata }
		);
	}
};
