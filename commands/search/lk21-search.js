/* global botNum */
import { layarkaca21 } from '../../utils/index.js';

export default {
	name: 'layarkaca21',
	description: 'Search movies through Layarkaca21 websites.',
	usage: '!layarkaca21 <query>',
	aliases: ['lk21', 'd21'],
	category: 'Search',
	cooldown: 5,
	limit: 4,
	status: 'enable',
	run: async ({ query, message, from, args, type }, client) => {
		if (!query) {
			return client[botNum].reply({ from, quoted: message }, 'You must provide a query.');
		}

		if ((args[1] == 'next' || args[1] == 'prev') && type == 'templateButtonReplyMessage') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v.source == args[2]);

			return await client[botNum].sendMessage(
				from,
				{
					image: { url: data[index].thumbnail },
					caption: 'Layarkaca21'.formatHeaders(),
					footer: `${data[index].title}
Quality : ${data[index].quality}
Country : ${data[index].country}
Cast : ${data[index].castArr.join(', ')}
Director : ${data[index].director}
Genre : ${data[index].genreArr.join(', ')}
IMDb : ${data[index].ratings}
Release Date : ${data[index].released}
Translate By : ${data[index].translateBy}

Void Bot     ${index + 1}/${data.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`,
					templateButtons: [
						index + 1 !== data.length
							? {
									quickReplyButton: {
										displayText: 'Next Movie',
										id: `.layarkaca21 next ${data[index + 1].source} ${JSON.stringify(data)}`,
									},
							  } /* eslint-disable-line */
							: {},
						index !== 0
							? {
									quickReplyButton: {
										displayText: 'Previous Movie',
										id: `.layarkaca21 prev ${data[index - 1].source} ${JSON.stringify(data)}`,
									},
							  } /* eslint-disable-line */
							: {},
					],
				},
				{ quoted: message },
			);
		}

		const result = await layarkaca21(query);

		if ('error' in result) {
			client[botNum].reply({ from, quoted: message }, result.error);
		}

		await client[botNum].sendMessage(
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

Void Bot     1/${result.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`,
				templateButtons: [
					result.length !== 1
						? {
								quickReplyButton: {
									displayText: 'Next Movie',
									id: `.layarkaca21 next ${result[1].source} ${JSON.stringify(result)}`,
								},
						  } /* eslint-disable-line */
						: {},
				],
			},
			{ quoted: message },
		);
	},
};
