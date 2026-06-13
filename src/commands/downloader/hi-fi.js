import dayjs from 'dayjs';
import lodash from 'lodash';
import parser from 'yargs-parser';

import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { hifi, metadata } from '../../utils/hi-fi/index.js';
import { color, delay, loggers } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'hifidownload',
	description: 'Download lossless music from Tidal via Hi-Fi API',
	usage:
		'!hifidownload `<query>`\n\nAvailable Flags :\n--index, -i , Directly download without sending the search result first. Starts from 0-<Response.length>',
	aliases: ['hifidownload', 'hifidl', 'hifidownloader', 'hifi-dl', 'hifi-download'],
	category: 'Downloader',
	cooldown: 8,
	limit: 3,
	status: 'enable',
	run: async ({ from, query, message, prettyNumber, prefix }, client) => {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		let wait = null;

		try {
			if (!query) {
				return await client.reply(from, L.errors.noQuery, message);
			}

			wait = await client.waitMessage(from, L.success.loading, message);

			let { _, index, id } = parser(query, {
				configuration: { 'short-option-groups': false },
				alias: { index: ['ix'], id: ['i'] }
			});

			query = _.join(' ');

			let caption = 'Hi-Fi Downloader'.formatHeaders();
			let watermark = 'Powered by Hidden Finder';

			if (typeof index === 'number') {
				const searchResults = await hifi.search(query);

				if (searchResults.items.length === 0) {
					return await wait.update('No results found for your query. Try again with another keyword.');
				}

				if (index > searchResults.length - 1) {
					return await wait.update(
						'Index are not match with the response length. Response length : ' + searchResults.length - 1
					);
				}

				await downloadAudio(client, searchResults, { index, from, message, prettyNumber, wait });
			} else if (id) {
				await downloadAudio(client, null, { id, from, message, prettyNumber, wait });
			} else {
				const searchResults = await hifi.search(query);

				if (searchResults.items.length === 0) {
					return await wait.update('No results found for your query. Try again with another keyword.');
				}

				const total = searchResults.items.length;
				const searchResultsChunk = lodash.chunk(searchResults.items, 30);

				await wait.update(`Songs with keyword ${query} found. Total Response : ${total}`);

				const builder = new client.TemplateBuilder.Carousel();

				let length = 0;

				for (const result of searchResultsChunk) {
					await builder
						.destination(from)
						.body(caption)
						.footer(watermark)
						.header('Header')
						.cards(
							result.map((value, index) => {
								let {
									id,
									title,
									duration,
									artists,
									streamStartDate,
									album: { cover }
								} = value;

								const songNumber = length + index + 1;

								cover = hifi.stringToCover(cover);

								return {
									body: `Title : ${title}\nArtist(s) : ${artists.map((v) => v.name).join(', ')}\nDuration : ${dayjs(duration * 1000).format('HH:mm:ss')}\nReleased : ${dayjs(streamStartDate).format('DD/MM/YYYY')}`,
									header: cover,
									footer: `Song ${songNumber} of ${total}`,
									buttons: [
										builder.button.url({ display: `Cover ${songNumber}`, url: cover }),
										builder.button.reply({
											display: 'Download',
											id: `${prefix}hifidownload --id ${id}`
										})
									]
								};
							})
						)
						.send();

					length += result.length;
					caption = '';
					watermark = '';
				}

				await wait.update('Please press the "Download" button on one of the results below :');
			}
		} catch (error) {
			await wait.update('Something went wrong. Please try again.');
		}
	}
});

const downloadAudio = async (client, data, { from, message, prettyNumber, id, index, wait }) => {
	await wait.update('Downloading Music...');

	const downloadInfo = await hifi.download(id ? id : data.items[index].id);

	loggers.warning(
		`${color('Downloading Hi-Fi Audio from', 'pink')} ${color(downloadInfo.domain, 'orange')} for ${color(prettyNumber, 'lilac')}`
	);

	if (downloadInfo?.error) {
		return await wait.update(`Error while downloading music.\n\n${downloadInfo.error}`);
	}

	await wait.update('Writing metadata to the file...');

	const buffer = await metadata(downloadInfo.track, downloadInfo.url, downloadInfo.cover);

	await wait.update('Writing metadata to the file success.');
	await delay(2000);
	await wait.update('Sending the file...');

	await client.send(
		from,
		{
			document: buffer,
			fileName: `${downloadInfo.track.artist.name} - ${downloadInfo.track.title}.flac`,
			mimetype: 'audio/flac'
		},
		{ quoted: message }
	);

	await wait.update('Command Finished. With total 1 Success.');

	loggers.warning(
		`${color('Downloaded Hi-Fi Audio from', 'pink')} ${color(downloadInfo.domain, 'orange')} for ${color(prettyNumber, 'lilac')}`
	);
};
