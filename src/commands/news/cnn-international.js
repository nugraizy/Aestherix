import { cnninternational, fetchBUFFER } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'cnninternational',
	minifiedDescription: 'CNN-International News',
	description: 'Showing latest news in International from CNN.',
	category: 'News',
	usage: '!cnninternational `<keywords/blank(to fetch latest news)>`',
	aliases: ['cnnint'],
	cooldown: 2,
	limit: 3,
	status: 'enable',
	async run({ query, from, message, args, cmd }, client) {
		if (args[1] === 'next' || args[1] === 'prev') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v.image === args[2] || v.link === args[2]);

			let caption = 'CNN International'.formatHeaders();

			caption += `\n\nTitle : ${data[index].title}\n`;
			caption += `Published : ${data[index].published}\n`;
			caption += `Content : ${data[index].body}\n`;

			return await client.instance.send(
				from,
				{
					...(data[index].image !== undefined ? { image: await fetchBUFFER(data[index].image), caption } : { text: caption }),
					templateButtons: [
						data[index].image !== undefined
							? { urlButton: { displayText: 'Image Source', url: args[1] === 'next' ? data[index].image : data[index].image } }
							: {},
						{ urlButton: { displayText: 'Article Source', url: args[1] === 'next' ? data[index].link : data[index].link } },
						index + 1 !== data.length
							? {
									quickReplyButton: {
										displayText: 'Next Article',
										id: `${cmd} next ${data[index + 1].image ?? data[index + 1].link} ${JSON.stringify(data)}`
									}
								} /* eslint-disable-line */
							: {},
						index !== 0
							? {
									quickReplyButton: {
										displayText: 'Previous Article',
										id: `${cmd} prev ${data[index - 1].image ?? data[index + 1].link} ${JSON.stringify(data)}`
									}
								} /* eslint-disable-line */
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

		const data = await cnninternational(query);

		if (data?.error) {
			return await client.instance.reply(from, data.error, message);
		}

		let caption = 'CNN International'.formatHeaders();

		caption += `\n\nTitle : ${data[0].title}\n`;
		caption += `Published : ${data[0].published}\n`;
		caption += `Content : ${data[0].body}\n`;

		caption += `\n${data
			.map(({ title, body, published }) => `Title : ${title}\nPublished : ${published}\nContent : ${body}`)
			.join('\n\n')}`.trimEnd();

		await client.instance.send(
			from,
			{
				...(data[0].image !== undefined
					? { image: await fetchBUFFER(data[0].image), caption: caption.formatForm() }
					: { text: caption.formatForm() }),
				templateButtons: [
					data[0].image !== undefined ? { urlButton: { displayText: 'Image Source', url: data[0].image } } : {},
					{ urlButton: { displayText: 'Article Source', url: data[0].link } },
					data.length !== 1
						? {
								quickReplyButton: {
									displayText: 'Next Article',
									id: `${cmd} next ${data[1].image ?? data[1].link} ${JSON.stringify(data)}`
								}
							} /* eslint-disable-line */
						: {}
				],
				footer: `1/${data.length}\nPowered by Hidden Finder`
			},
			{ quoted: message }
		);
	}
};
