import { numberWithCommas, MyAnimeList } from '../../utils/index.js';

const parse = (obj) => `Full Title : ${obj?.title || 'n/a'}
EN : ${obj?.alternative_titles?.en || 'n/a'}
JP : ${obj?.alternative_titles?.ja || 'n/a'}
ID : ${obj?.id || 'n/a'}

Rank : ${obj?.rank || 'n/a'}
Score : ${obj?.score || 'n/a'}
Popularity : ${obj?.popularity || 'n/a'}
Tot. Listed Users : ${numberWithCommas(obj?.num_list_users || 0)}
Tot. Scoring Users : ${numberWithCommas(obj?.num_scoring_users || 0)}
NSFW? : ${obj?.nsfw === 'white' ? 'No' : 'Yes'}
Anime Type : ${obj?.media_type?.capitalize() || 'n/a'}
Status : ${obj?.status?.replace('_', ' ')?.capitalize() || 'n/a'}
Source : ${obj?.source?.replace('_', '')?.capitalize()}
Rating : ${obj?.rating?.replace('_', ' ')?.capitalize() || 'n/a'}
Genres : ${obj?.genres?.map(({ name }) => name)?.join(', ') || 'n/a'}
	
Synopsis : ${obj?.synopsis || 'n/a'}`;

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'malsearchmanga',
	description: 'Search a manga on MyAnimeList',
	usage: '!malsearchmanga <query>',
	category: 'Anime',
	aliases: ['malmanga'],
	limit: 2,
	cooldown: 2,
	status: 'enable',
	async run({ query, from, message, args, type, cmd, groupMetadata }, client) {
		const mal = new MyAnimeList();

		if (args[1] === 'detail' && type === 'listResponseMessage') {
			const detail = await mal.getMangaDetail(args[2]);

			if ('error' in detail) {
				return await client[botNum].reply({ groupMetadata, from, quoted: message }, detail.message);
			}

			const caption = parse(detail);
			const {
				id,
				main_picture: { large, medium }
			} = detail;

			return await client[botNum].send(
				from,
				{
					image: { url: large },
					caption: `${'Myanimelist Search [ Manga ]'.formatHeaders()}\n\n${caption.trim()}`,
					footer: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪',
					templateButtons: [
						{ urlButton: { displayText: 'Myanimelist Source', url: `https://www.myanimelist.net/manga/${id}` } },
						{ urlButton: { displayText: 'Image HD Source', url: large } },
						{ urlButton: { displayText: 'Image SD Source', url: medium } }
					]
				},
				{ groupMetadata, quoted: message }
			);
		}

		const result = await mal.searchManga(query);

		if ('error' in result) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, result.message);
		}

		const rows = result
			.map(({ title, id }, i) => {
				if (i !== 0) {
					return { rows: [{ title: `[ ${i + 1} ] ${title}`, rowId: `${cmd} detail ${id}` }], title: '\t' };
				}
			})
			.filter(Boolean);

		const caption = parse(result[0]);
		const {
			id,
			main_picture: { large, medium }
		} = result[0];

		await client[botNum].send(
			from,
			{
				image: { url: large },
				caption: `${'Myanimelist Search [ Manga ]'.formatHeaders()}\n\n${caption.trim()}`,
				footer: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪',
				templateButtons: [
					{ urlButton: { displayText: 'Myanimelist Source', url: `https://www.myanimelist.net/manga/${id}` } },
					{ urlButton: { displayText: 'Image HD Source', url: large } },
					{ urlButton: { displayText: 'Image SD Source', url: medium } }
				]
			},
			{ groupMetadata, quoted: message }
		);

		await client[botNum].send(
			from,
			{
				buttonText: 'Myanimelist Search [ Manga ]'.formatHeaders(),
				text: 'Myanimelist search',
				footer: 'choose one of the title inside of the list to see the details of the manga.',
				sections: rows
			},
			{ groupMetadata }
		);
	}
};
