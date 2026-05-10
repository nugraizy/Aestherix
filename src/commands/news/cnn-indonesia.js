import { cmdId } from '../../helper/modules/prefix.js';
import { cnnindonesia } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'cnnindonesia',
	minifiedDescription: 'CNN-Indonesia News',
	description: 'Showing latest news in Indonesia from CNN.',
	category: 'News',
	usage: '!cnnindonesia `<keyword/blank(to fetch latest news)>`',
	aliases: ['cnnid', 'cnid'],
	cooldown: 2,
	limit: 1,
	status: 'enable',
	async run({ query, from, message, args, cmd, prefix }, client) {
		const cmdName = cmd.replace(/^[^a-zA-Z]+/, '');

		if (args[1] === 'next' || args[1] === 'prev') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v.image === args[2]);

			let caption = 'CNN Indonesia'.formatHeaders();

			caption += `\n\nTitle : ${data[index].title}\n`;
			caption += `Place : ${data[index].places}\n`;
			caption += `Published : ${data[index].published}\n`;
			caption += `Content : ${data[index].body}\n`;

			return await client.instance.send(
				from,
				{
					image: { url: data[index].image },
					caption,
					templateButtons: [
						{ urlButton: { displayText: 'Image Source', url: args[1] === 'next' ? data[index].image : data[index].image } },
						{ urlButton: { displayText: 'Article Source', url: args[1] === 'next' ? data[index].link : data[index].link } },
						index + 1 !== data.length
							? {
									quickReplyButton: {
										displayText: 'Next Article',
										id: cmdId(cmdName, `next ${data[index + 1].image} ${JSON.stringify(data)}`, { prefix })
									}
								}
							: {},
						index !== 0
							? {
									quickReplyButton: {
										displayText: 'Previous Article',
										id: cmdId(cmdName, `prev ${data[index - 1].image} ${JSON.stringify(data)}`, { prefix })
									}
								}
							: {}
					],
					footer: `${index + 1}/${data.length}\nPowered by Hidden Finder`
				},
				{ quoted: message }
			);
		}

		if (!query) {
			return client.instance.reply(from, 'Please provide queries', message);
		}

		const data = await cnnindonesia(query);

		if (data?.error) {
			return await client.instance.reply(from, data.error, message);
		}

		let caption = 'CNN Indonesia'.formatHeaders();

		caption += `\n\nTitle : ${data[0].title}\n`;
		caption += `Place : ${data[0].places}\n`;
		caption += `Published : ${data[0].published}\n`;
		caption += `Content : ${data[0].body}\n`;

		caption += `\n${data
			.map(
				({ title, places, body, published }) =>
					`Title : ${title}\nPlace : ${places}\nPublished : ${published}\nContent : ${body}`
			)
			.join('\n\n')}`.trimEnd();

		await client.instance.send(
			from,
			{
				image: { url: data[0].image },
				caption: caption.formatForm(),
				templateButtons: [
					{ urlButton: { displayText: 'Image Source', url: data[0].image } },
					{ urlButton: { displayText: 'Article Source', url: data[0].link } },
					data.length !== 1
						? {
								quickReplyButton: {
									displayText: 'Next Article',
									id: cmdId(cmdName, `next ${data[1].image} ${JSON.stringify(data)}`, { prefix })
								}
							}
						: {}
				],
				footer: `1/${data.length}\nPowered by Hidden Finder`
			},
			{ quoted: message }
		);
	}
};
