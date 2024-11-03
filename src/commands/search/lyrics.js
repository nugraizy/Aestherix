import { removeDuplicatesArray } from '../../utils/modules/index.js';
import { arq } from '../../utils/arq/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'findlyrics',
	minifiedDescription: 'Search Lyrics',
	description: 'Search song lyrics.',
	usage: '!findlyrics <query>',
	category: 'Search',
	aliases: ['lyrics', 'lyric'],
	limit: 4,
	cooldown: 5,
	status: 'enable',
	async run({ query, from, message, args, type }, client) {
		if (!query) {
			return await client.instance.reply('You must provide a query.', { from, quoted: message });
		}

		if ((args[1] === 'next' || args[1] === 'prev') && type === 'templateButtonReplyMessage') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v.index === args[2]);

			return await client.instance.send(
				from,
				{
					text: `${'Lyrics'.formatHeaders()}
                    
Artist : ${data[index].artist}
Song : ${data[index].song}
\n${data[index].lyrics}`.formatForm(),
					templateButtons: [
						index + 1 !== data.length
							? {
									quickReplyButton: {
										displayText: 'Next Lyrics',
										id: `.lyrics next ${data[index + 1].index} ${JSON.stringify(data)}`
									}
							  } /* eslint-disable-line */
							: {},
						index !== 0
							? {
									quickReplyButton: {
										displayText: 'Previous Lyrics',
										id: `.lyrics prev ${data[index - 1].index} ${JSON.stringify(data)}`
									}
							  } /* eslint-disable-line */
							: {}
					],
					footer: `Void Bot     ${index + 1}/${data.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`
				},
				{ quoted: message }
			);
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const result = await arq.findLyrics(querie.trim());

			if ('error' in result || !result.ok) {
				client.instance.reply(JSON.stringify(result));
				continue;
			}

			result.result.forEach((v) => v.lyrics.replace('Paroles de la chanson par', ''));
			result.result = result.result.map((v, i) => ({ index: i, ...v }));
			await client.instance.send(
				from,
				{
					text: `${'Lyrics'.formatHeaders()}
                    
Artist : ${result.result[0].artist}
Song : ${result.result[0].song}
\n${result.result[0].lyrics}`,
					templateButtons: [
						result.result.length !== 1
							? {
									quickReplyButton: {
										displayText: 'Next Lyrics',
										id: `.lyrics next ${result.result[1].index} ${JSON.stringify(result.result)}`
									}
							  } /* eslint-disable-line */
							: {}
					],
					footer: `Void Bot     1/${result.result.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`
				},
				{ quoted: message }
			);
		}
	}
};
