import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { fetchBUFFER, removeDuplicatesArray } from '../../utils/modules/index.js';
import { spotifier } from '../../utils/spotifier/index.js';
import { defineCommand } from '../_define.js';

const regex = (input) =>
	/(https?:\/\/open.spotify.com\/(track|user|artist|album)\/[a-zA-Z0-9]+(\/playlist\/[a-zA-Z0-9]+|)|spotify:(track|user|artist|album):[a-zA-Z0-9]+(:playlist:[a-zA-Z0-9]+|))/.test(
		input
	);

const extractId = (url) => {
	return url.match(/https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:track\/|\?uri=spotify:track:)((\w|-){22})/)?.[1] || null;
};

const getSpotifyType = (url) => {
	const reg = /^(https:\/\/open\.spotify\.com\/(track|album|playlist|artist)\/[a-zA-Z0-9]+)(\?.+)?$/gi;
	const match = reg.exec(url);

	if (!match) {
		return 'track';
	}

	return match[2];
};

export default defineCommand({
	name: 'spotifytracks',
	minifiedDescription: 'Search Spotify Tracks',
	description: 'Search song on Spotify.',
	usage: '!spotifytracks `<query>`',
	category: 'Search',
	aliases: ['spotifytra'],
	limit: 4,
	cooldown: 8,
	status: 'enable',
	async run({ query, from, message }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Ls = useLocale(locale, 'search');

		if (!query) {
			return await client.reply(from, L.errors.noQuery, message);
		}

		query = removeDuplicatesArray(query.split(','));

		for (const querie of query) {
			const result = regex(querie) ? await spotifier.getTracks(extractId(querie)) : await spotifier.searchTracks(querie);

			if (!result.status) {
				await client.reply(from, result.message, message);
				continue;
			}

			let caption = '';

			for (const {
				artists,
				name,
				duration_ms: durationMs,
				external_urls: { spotify }
			} of result?.data?.items ?? result.tracks) {
				caption += `✦ ${Ls.labels.mediaId} : ${extractId(spotify)}\n🖼️ Type : ${getSpotifyType(
					spotify
				)}\n📕 Title : ${name}\n📡 ${Ls.labels.artists} : ${artists
					.map((v) => v.name)
					.map((v, i) => (artists.length !== 1 && i + 1 === artists.length ? `and ${v}` : v))
					.join(', ')}\n`;
				caption += `Duration : ${durationMs.toTime()}\n\n`;
			}

			await client.send(
				from,
				{
					image: await fetchBUFFER(result?.data?.items?.[0]?.album?.images?.[0]?.url ?? result.tracks[0].album.images[0].url),
					caption: Ls.titles.spotifyTracks.formatHeaders() + `\n\n${caption.formatForm()}`
					// templateButtons: [
					// 	{
					// 		urlButton: {
					// 			displayText: 'Image Source',
					// 			url: result?.data?.items?.[0]?.album?.images?.[0]?.url ?? result.tracks[0].album.images[0].url
					// 		}
					// 	},
					// 	{
					// 		urlButton: {
					// 			displayText: 'Open On Spotify',
					// 			url: result?.data?.items?.[0]?.external_urls?.spotify ?? result.tracks[0].external_urls.spotify
					// 		}
					// 	},
					// 	{
					// 		quickReplyButton: {
					// 			displayText: 'Download',
					// 			id: `.spotifydl ${result?.data?.items?.[0]?.name ?? result.tracks[0].name} - ${
					// 				result?.data?.items?.[0]?.artists?.[0]?.name ?? result.tracks[0].external_urls.spotify
					// 			}`
					// 		}
					// 	}
					// ],
					// footer: caption
				},
				{ quoted: message }
			);
			// 	await client.send(
			// 		from,
			// 		{
			// 			buttonText: 'Open List',
			// 			text: '\t',
			// 			footer: '```Looking for some more? Choose between these options.```',
			// 			title: 'Spotify Track'.formatHeaders(),
			// 			sections: rows
			// 		},
			// 		{  }
			// 	);
		}
	}
});
