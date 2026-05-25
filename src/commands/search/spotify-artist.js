import { BOT_NAME } from '../../core/constants.js';

import { cmdId } from '../../helper/modules/prefix.js';
import { fetchBUFFER, removeDuplicatesArray } from '../../utils/modules/index.js';
import { spotifier } from '../../utils/spotifier/index.js';
import { defineCommand } from '../_define.js';

const regex = (input) =>
	/(https?:\/\/open.spotify.com\/(track|user|artist|album)\/[a-zA-Z0-9]+(\/playlist\/[a-zA-Z0-9]+|)|spotify:(track|user|artist|album):[a-zA-Z0-9]+(:playlist:[a-zA-Z0-9]+|))/.test(
		input
	);

export default defineCommand({
	name: 'spotifyartist',
	minifiedDescription: 'Search Spotify Artists',
	description: 'Search artist on Spotify.',
	usage: '!spotifyartist `<query>`',
	category: 'Search',
	aliases: ['spotifyart'],
	limit: 5,
	cooldown: 8,
	status: 'enable',
	async run({ query, from, message }, client) {
		if (!query) {
			return await client.reply(from, 'You must provide a query.', message);
		}

		query = removeDuplicatesArray(query.split(','));

		for (const querie of query) {
			let result;
			let images;
			let tracks;
			let id;
			const source = (ids) => `https://open.spotify.com${ids}`;

			if (regex(querie)) {
				id = querie.match(/https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:artist\/|\?uri=spotify:artist:)((\w|-){22})/)[1];
				result = await spotifier.getArtists(id);

				if (!result.status) {
					await client.reply(from, result.message, message);
					continue;
				}
			} else {
				result = await spotifier.searchArtist(querie);

				if (!result.status) {
					await client.reply(from, result.message, message);
					continue;
				}

				id = result.data.items[0].id;
				result = await spotifier.getArtists(id);
			}

			tracks = await spotifier.getArtistsTopTracks(id);
			images = result.artists[0].images[0].url;
			let caption = '';
			let count = 0;
			const rows = [];

			for (const { artists, name, duration_ms: durationMs } of tracks.data.tracks) {
				if (count === 0) {
					caption += `Title : ${name}\n`;
					caption += `Artists : ${artists
						.map((v) => v.name)
						.map((v, i) => (artists.length !== 1 && i + 1 === artists.length ? `and ${v}` : v))
						.join(', ')}\n`;
					caption += `Duration : ${durationMs.toTime()}\n`;
				} else {
					rows.push({
						rows: [
							{
								title: `${count}. ${artists
									.map((v) => v.name)
									.map((v, i) => (artists.length !== 1 && i + 1 === artists.length ? `and ${v}` : v))
									.join(', ')} - ${name}`,
								rowId: cmdId('spotifydl', `${name} - ${artists[0].name}`)
							}
						],
						title: `${BOT_NAME} | Powered by Spotify`
					});
				}

				count++;
			}

			await client.send(
				from,
				{
					image: await fetchBUFFER(images),
					caption: 'Spotify Artist'.formatHeaders() + `\n\n${caption.formatForm()}`
					// templateButtons: [
					// 	{
					// 		urlButton: {
					// 			displayText: 'Image Source',
					// 			url: images
					// 		}
					// 	},
					// 	{
					// 		urlButton: {
					// 			displayText: 'Open Artist On Spotify',
					// 			url: source(`/artist/${id}`)
					// 		}
					// 	},
					// 	{
					// 		urlButton: {
					// 			displayText: 'Open Song On Spotify',
					// 			url: source(`/track/${tracks.data.tracks[0].id}`)
					// 		}
					// 	},
					// 	{
					// 		quickReplyButton: {
					// 			displayText: 'Download',
					// 			id: `.spotifydl ${tracks.data.tracks[0].artists[0].name} - ${tracks.data.tracks[0].name}`
					// 		}
					// 	}
					// ],
					// footer:
				},
				{ quoted: message }
			);
			await client.send(
				from,
				{
					buttonText: 'Open List',
					text: '\t',
					footer: '```Looking for some more? Choose between these options.```',
					title: 'Spotify Artist'.formatHeaders(),
					sections: rows
				},
				{}
			);
		}
	}
});
