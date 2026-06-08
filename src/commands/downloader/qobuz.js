import dayjs from 'dayjs';
import lodash from 'lodash';
import parser from 'yargs-parser';

import { cmdId } from '../../helper/modules/prefix.js';
import { color, loggers } from '../../utils/modules/index.js';
import { metadata, qobuz } from '../../utils/qobuz/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'qobuzdownload',
	description: 'Download lossless music from Qobuz',
	usage:
		'!qobuzdownload `<query>`\n\nAvailable Flags :\n--index, -i , Directly download without sending the search result first. Starts from 0-<Response.length>',
	aliases: ['qobuz', 'qobuzdl', 'qobuz-dl', 'qobuz-download'],
	category: 'Downloader',
	cooldown: 8,
	limit: 3,
	status: 'enable',
	async run({ from, query, message, prettyNumber, prefix, device }, client) {
		let wait = null;

		try {
			if (!query) {
				return await client.reply(from, 'You must provide a query.', message);
			}

			wait = await client.waitMessage(from, 'Please wait...', message);

			let { _, index, id } = parser(query, {
				configuration: { 'short-option-groups': false },
				alias: { index: ['ix'], id: ['i'] }
			});

			query = _.join(' ');

			if (typeof index === 'number') {
				const results = await qobuz.searchTracks(query);

				if (typeof results === 'string') {
					return await wait.update(results);
				}

				if (!results.length) {
					return await wait.update('No results found for your query. Try again with another keyword.');
				}

				if (index > results.length - 1) {
					return await wait.update('Index does not match the response length. Max index: ' + (results.length - 1));
				}

				await downloadAudio(client, results[index], { from, message, prettyNumber, wait });
			} else if (id) {
				let cached = qobuz.getTrack(String(id));

				if (!cached) {
					const results = await qobuz.searchTracks(String(id));

					if (Array.isArray(results) && results.length) {
						cached = results.find((t) => String(t.id) === String(id)) || results[0];
					}
				}

				await downloadAudio(client, cached || { id }, { from, message, prettyNumber, wait });
			} else {
				const results = await qobuz.searchTracks(query);

				if (typeof results === 'string') {
					return await wait.update(results);
				}

				if (!results.length) {
					return await wait.update('No results found for your query. Try again with another keyword.');
				}

				const total = results.length;

				await wait.update(`Songs with keyword "${query}" found. Total: ${total}`);

				if (device.isIos) {
					const items = results.slice(0, 20);
					const container = {
						text: 'Qobuz Downloader'.formatHeaders() + '\n\n',
						buttons: []
					};

					const builder = new client.TemplateBuilder.Native();

					items.forEach((track, idx) => {
						const artists = track.artists?.map((a) => a.name).join(', ') || track.artist?.name || '';
						const duration = track.duration ? dayjs(track.duration * 1000).format('mm:ss') : 'N/A';

						container.text += `${idx + 1}. ${artists} - ${track.title} • ${duration}\n> ${prefix}qobuz --id ${track.id}\n`;
						container.buttons.push(
							builder.button.reply({
								display: `${idx + 1}. ${artists} - ${track.title}`.slice(0, 40),
								id: cmdId('qobuz', `--id ${track.id}`)
							})
						);
					});

					await builder
						.destination(from)
						.body(container.text)
						.footer('Powered by Hidden Finder')
						.buttons(...container.buttons)
						.send();
				} else {
					const chunks = lodash.chunk(results, 30);
					const builder = new client.TemplateBuilder.Carousel();
					let caption = 'Qobuz Downloader'.formatHeaders();
					let watermark = 'Powered by Hidden Finder';
					let length = 0;

					for (const chunk of chunks) {
						await builder
							.destination(from)
							.body(caption)
							.footer(watermark)
							.header('Header')
							.cards(
								chunk.map((track, idx) => {
									const songNumber = length + idx + 1;
									const cover = track.album?.image || '';
									const artists = track.artists?.map((a) => a.name).join(', ') || track.artist?.name || '';
									const duration = track.duration ? dayjs(track.duration * 1000).format('mm:ss') : 'N/A';

									return {
										body: `Title : ${track.title}\nArtist(s) : ${artists}\nDuration : ${duration}\nAlbum : ${track.album?.title || 'N/A'}`,
										header: cover || Buffer.alloc(10),
										footer: `Song ${songNumber} of ${total}`,
										buttons: [
											...(cover ? [builder.button.url({ display: `Cover ${songNumber}`, url: cover })] : []),
											builder.button.reply({
												display: 'Download',
												id: `${prefix}qobuz --id ${track.id}`
											})
										]
									};
								})
							)
							.send();

						length += chunk.length;
						caption = '';
						watermark = '';
					}
				}

				await wait.update('Please press the "Download" button on one of the results below :');
			}
		} catch (error) {
			const msg = error?.message || 'Something went wrong. Please try again.';

			await wait?.update(msg);
		}
	}
});

async function downloadAudio(client, track, { from, message, prettyNumber, wait }) {
	await wait.update('Downloading Music...');

	const downloadInfo = await qobuz.download(track.id);

	if (typeof downloadInfo === 'string') {
		return await wait.update(`Error: ${downloadInfo}`);
	}

	const trackData = downloadInfo.track;
	const cover = downloadInfo.cover || track?.album?.image || track?.album?.raw?.image?.large || null;

	const artistName = trackData?.artist?.name || track?.artist?.name || track?.artists?.[0]?.name || 'Unknown';
	const title = trackData?.title || track?.title || 'Unknown';

	loggers.warning(
		`${color('Downloading Qobuz Audio from', 'pink')} ${color(downloadInfo.domain || 'qobuz', 'orange')} for ${color(prettyNumber, 'lilac')}`
	);

	await wait.update('Writing metadata to the file...');

	const buffer = await metadata(trackData || track, downloadInfo.url, cover);

	await wait.update('Sending the file...');

	await client.send(
		from,
		{
			document: buffer,
			fileName: `${artistName} - ${title}.flac`,
			mimetype: 'audio/flac'
		},
		{ quoted: message }
	);

	await wait.update('Command Finished. With total 1 Success.');

	loggers.warning(
		`${color('Downloaded Qobuz Audio from', 'pink')} ${color(downloadInfo.domain || 'qobuz', 'orange')} for ${color(prettyNumber, 'lilac')}`
	);
}
