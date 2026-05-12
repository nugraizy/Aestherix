import { cmdId } from '../../helper/modules/prefix.js';
import { youtube } from '../../utils/index.js';
import { numberWithCommas } from '../../utils/modules/index.js';

const boxen = (text) => {
	const texts = text.split('\n');
	let box = `╭───╌┄ ${texts[0]} ┄┄╌────\n`;

	box += texts
		.slice(1)
		.map((v) => `│ ${v}`)
		.join('\n');
	box += '\n╰────┄┄';

	return box;
};

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'ytsearch',
	minifiedDescription: 'Search YouTube',
	description: 'Search YouTube',
	usage: '!ytsearch `<query>`',
	aliases: ['yts', 'ytsr'],
	category: 'Search',
	cooldown: 10,
	limit: 5,
	status: 'enable',
	async run({ from, query, message }, client) {
		if (!query) {
			return client.reply(from, 'Please specify a query.', message);
		}

		let result = await youtube.core.search(query);

		result = result.filter((v) => v.type === 'video');

		let capt = 'YouTube Search'.formatHeaders();

		const builder = new client.TemplateBuilder.Carousel();

		await builder
			.destination(from)
			.body(capt)
			.footer('Powered by Hidden Finder')
			.header('Header')
			.cards(
				result.map(({ title, timestamp, views, author, image, thumbnail, url }) => ({
					body: `📡 Author Channel : ${author.name}\n👀 Views : ${numberWithCommas(views)}\n⏳ Duration : ${(
						timestamp ?? 'No Data'
					).formatForm()}`,
					footer: title,
					title: '',
					header: image || thumbnail,
					buttons: [
						builder.button.url({
							display: 'Watch Video',
							url
						}),
						builder.button.url({
							display: 'Original Thumbnail',
							url: image || thumbnail
						}),
						builder.button.reply({
							display: 'Download Video',
							id: cmdId('ytmp4', url)
						}),
						builder.button.reply({
							display: 'Download Audio',
							id: cmdId('ytmp3', url)
						})
					]
				}))
			)
			.send();

		// 		let i = 0;

		// 		for (const { videoId, title, timestamp, views, author } of result) {
		// 			const caption = boxen(
		// 				`NO. ${i + 1}
		// ✦ Video ID : ${videoId}
		// 📕 Title : ${title}
		// 👀 Views : ${numberWithCommas(views)}
		// 📡 Author Channel : ${author.name}
		// ⏳ Duration : ${timestamp ?? 'No Data'}`.formatForm()
		// 			);

		// 			capt += `${caption}\n\n`;

		// 			i++;
		// 		}

		// let jpegThumbnail = sharp(new Buffer.from(await fetchBUFFER(result[0].image), 'base64'));

		// jpegThumbnail = await jpegThumbnail.resize(300, 300).toBuffer();

		// await client.send(
		// 	from,
		// 	{
		// 		text: capt.trim()

		// 		// caption: capt,
		// 		// footer: 'Powered by Hidden Finder',
		// 		// buttons: [
		// 		// 	{
		// 		// 		buttonId: `.ytmp4 get ${url}`,
		// 		// 		buttonText: { displayText: '
		// 		// Video' },
		// 		// 		type: 1
		// 		// 	}
		// 		// ]
		// 	},
		// 	{
		// 		,
		// 		quoted: message
		// 	}
		// );

		// const row = [];

		// result.forEach(({ url, title, timestamp, views, author }) => {
		// 	row.push(
		// 		{
		// 			rows: [{ title: `MP4 | ${title}`, rowId: `.ytv ${url}` }],
		// 			title: `${author.name} | 👁️‍🗨️ ${numberWithCommas(views)} | ${timestamp}`
		// 		},
		// 		{
		// 			rows: [{ title: `MP3 | ${title}`, rowId: `.yta ${url}` }],
		// 			title: `${author.name} | 👁️‍🗨️ ${numberWithCommas(views)} | ${timestamp}`
		// 		}
		// 	);

		// 	if (configuration.OPTIONS.multiCmd) {
		// 		row.push({
		// 			rows: [{ title: `MP3 & MP4 | ${title}`, rowId: `.yta ${url}|.ytv ${url}` }],
		// 			title: `${author.name} | 👁️‍🗨️ ${numberWithCommas(views)} | ${timestamp}`
		// 		});
		// 	}
		// });

		// await client.send(
		// 	from,
		// 	{
		// 		buttonText: 'Open list',
		// 		title: 'See other result',
		// 		footer: 'Made by Void Bot. Powered by Hidden Finder',
		// 		text: '\t',
		// 		sections: row
		// 	},
		// 	{  }
		// );
	}
};
