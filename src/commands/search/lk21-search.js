import { cmdId } from '../../helper/modules/prefix.js';
import { layarkaca21 } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'layarkaca21',
	minifiedDescription: 'Search Layarkaca21',
	description: 'Search movies from Layarkaca21 websites.',
	usage: '!layarkaca21 `<query>`',
	aliases: ['lk21', 'd21'],
	category: 'Search',
	cooldown: 5,
	limit: 4,
	status: 'enable',
	run: async ({ query, message, from, args, type }, client) => {
		if (!query) {
			return client.instance.reply(from, 'You must provide a query.', message);
		}

		if ((args[1] === 'next' || args[1] === 'prev') && type === 'templateButtonReplyMessage') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v.source === args[2]);

			return await client.instance.send(
				from,
				{
					image: { url: data[index].thumbnail },
					caption:
						'Layarkaca21'.formatHeaders() +
						`\n\n${data[index].title}
Quality : ${data[index].quality}
Country : ${data[index].country}
Cast : ${data[index].castArr.join(', ')}
Director : ${data[index].director}
Genre : ${data[index].genreArr.join(', ')}
IMDb : ${data[index].ratings}
Release Date : ${data[index].released}
Translate By : ${data[index].translateBy}
					
Powered by Hidden Finder`.formatForm(),
					templateButtons: [
						index + 1 !== data.length
							? {
									quickReplyButton: {
										displayText: 'Next Movie',
										id: cmdId('layarkaca21', `next ${data[index + 1].source} ${JSON.stringify(data)}`)
									}
								}
							: {},
						index !== 0
							? {
									quickReplyButton: {
										displayText: 'Previous Movie',
										id: cmdId('layarkaca21', `prev ${data[index - 1].source} ${JSON.stringify(data)}`)
									}
								}
							: {}
					]
				},
				{ quoted: message }
			);
		}

		const result = await layarkaca21(query);

		if (result?.error) {
			client.instance.reply(from, result.error, message);
		}

		await client.instance.send(
			from,
			{
				image: { url: result[0].thumbnail },
				caption: 'Layarkaca21'.formatHeaders(),
				footer: `${result[0].title}
Quality : ${result[0].quality}
Country : ${result[0].country}
Cast : ${result[0].castStr(', ')}
Director : ${result[0].director}
Genre : ${result[0].genreStr(', ')}
IMDb : ${result[0].ratings}
Release Date : ${result[0].released}
Translate By : ${result[0].translateBy}

1/${result.length}\nPowered by Hidden Finder`,
				templateButtons: [
					result.length !== 1
						? {
								quickReplyButton: {
									displayText: 'Next Movie',
									id: cmdId('layarkaca21', `next ${result[1].source} ${JSON.stringify(result)}`)
								}
							}
						: {}
				]
			},
			{ quoted: message }
		);
	}
};
