import yn from 'yn';

import { Jikan, increment, numberWithCommas } from '../../utils/index.js';

const parse = (obj) =>
	`Full Title : ${obj?.title || 'n/a'}
EN : ${obj?.title_english || 'n/a'}
JP : ${obj?.title_japanese || 'n/a'}
ID : ${obj?.mal_id || 'n/a'}

Rank : ${obj?.rank || 'n/a'}
Score : ${obj?.score || 'n/a'}
Popularity : ${obj?.popularity || 'n/a'}
Type : ${obj?.type || 'n/a'}
Status : ${obj?.status || 'n/a'}
Tot. Listed Users : ${numberWithCommas(obj?.members || 0) || 'n/a'}
Tot. Scoring Users : ${numberWithCommas(obj?.scored_by || 0) || 'n/a'}
Tot. Episodes : ${numberWithCommas(obj?.episodes || 0) || 'n/a'}
Start Broadcasting : ${obj?.aired?.string || 'n/a'}
Rating : ${obj?.rating || 'n/a'}
Genres : ${obj?.genres?.map(({ name }) => name)?.join(', ') || 'n/a'}
	
Synopsis : ${obj?.synopsis || 'n/a'}`.formatForm();

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'malanime',
	minifiedDescription: 'MAL Search Anime',
	description: 'Search an anime on MyAnimeList',
	usage: '!malanime `<query>`',
	category: 'Anime',
	aliases: ['malanim'],
	limit: 2,
	cooldown: 2,
	status: 'enable',
	async run({ query, from, message, sender, waitForInput }, client) {
		const mal = new Jikan();

		const result = await mal.anime.search(query);

		if (result?.error) {
			return await client.instance.reply(from, result.message, message);
		}

		const incrementedIndex = increment(0, result.data.length - 1);

		const send = async () => {
			const index = incrementedIndex();

			if (index === null) {
				return;
			}

			const caption = parse(result.data[index]);
			const {
				images: {
					jpg: { large_image_url: large }
				}
			} = result.data[index];

			await client.instance.send(
				from,
				{
					image: { url: large },
					caption: `${'Myanimelist Search [ Anime ]'.formatHeaders()}\n\n${caption.trim()}
\nAnime ${index + 1} of ${result.data.length}`
				},
				{ quoted: message }
			);

			if (index + 1 >= result.length) {
				return;
			}

			const wait = await waitForInput(client, {
				message: 'Do you want to get more anime? [y/n]',
				expectedType: ['conversation', 'extendedTextMessage'],
				from,
				sender,
				timeInSecond: 10
			});

			if (wait.timeout) {
				return;
			}

			const isYes = yn(wait.message);

			if (isYes === undefined) {
				return;
			}

			if (isYes) {
				await send();
			}
		};

		await send();
	}
};
