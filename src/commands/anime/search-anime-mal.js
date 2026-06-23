import yn from 'yn';

import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { Jikan, increment, numberWithCommas } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

const parse = (obj, La) =>
	`${La.labels.fullTitle} : ${obj?.title || 'n/a'}
${La.labels.enTitle} : ${obj?.title_english || 'n/a'}
${La.labels.jpTitle} : ${obj?.title_japanese || 'n/a'}
${La.labels.idTitle} : ${obj?.mal_id || 'n/a'}

${La.labels.rank} : ${obj?.rank || 'n/a'}
${La.labels.score} : ${obj?.score || 'n/a'}
${La.labels.popularity} : ${obj?.popularity || 'n/a'}
${La.labels.type} : ${obj?.type || 'n/a'}
${La.labels.status} : ${obj?.status || 'n/a'}
${La.labels.totListedUsers} : ${numberWithCommas(obj?.members || 0) || 'n/a'}
${La.labels.totScoringUsers} : ${numberWithCommas(obj?.scored_by || 0) || 'n/a'}
${La.labels.totEpisodes} : ${numberWithCommas(obj?.episodes || 0) || 'n/a'}
${La.labels.startBroadcasting} : ${obj?.aired?.string || 'n/a'}
${La.labels.rating} : ${obj?.rating || 'n/a'}
${La.labels.genres} : ${obj?.genres?.map(({ name }) => name)?.join(', ') || 'n/a'}
	
${La.labels.synopsis} : ${obj?.synopsis || 'n/a'}`.formatForm();

export default defineCommand({
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
		const locale = await getLocale(from);
		const La = useLocale(locale, 'anime');

		const mal = new Jikan();

		const result = await mal.anime.search(query);

		if (result?.error) {
			return await client.reply(from, result.message, message);
		}

		const incrementedIndex = increment(0, result.data.length - 1);

		const send = async () => {
			const index = incrementedIndex();

			if (index === null) {
				return;
			}

			const caption = parse(result.data[index], La);
			const {
				images: {
					jpg: { large_image_url: large }
				}
			} = result.data[index];

			await client.send(
				from,
				{
					image: { url: large },
					caption: `${La.titles.searchAnimeMal.formatHeaders()}\n\n${caption.trim()}
${t(locale, 'anime.labels.mangaOf', ['Anime', index + 1, result.data.length])}`
				},
				{ quoted: message }
			);

			if (index + 1 >= result.length) {
				return;
			}

			const wait = await waitForInput(client, {
				message: t(locale, 'anime.labels.doYouWantMore', ['anime']),
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
});
