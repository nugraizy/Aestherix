import dayjs from 'dayjs';
import lodash from 'lodash';
import parser from 'yargs-parser';

import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
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
	run: async ({ from, query, message, prettyNumber, prefix, sender }, client) => {
		const locale = await getLocale(from, sender);
		const L = useLocale(locale, 'common');
		const DL = useLocale(locale, 'downloader');

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

			let caption = DL.titles.hiFi.formatHeaders();
			let watermark = t(locale, 'common.core.footer.poweredBy', ['Hidden Finder']);

			if (typeof index === 'number') {
				const searchResults = await hifi.search(query);

				if (searchResults.items.length === 0) {
					return await wait.update(L.core.errors.noResultsForQuery);
				}

				if (index > searchResults.length - 1) {
					return await wait.update(
						t(locale, 'common.core.errors.numberRange', [0, searchResults.length - 1])
					);
				}

				await downloadAudio(client, searchResults, { index, from, message, prettyNumber, wait, locale, L });
			} else if (id) {
				await downloadAudio(client, null, { id, from, message, prettyNumber, wait, locale, L });
			} else {
				const searchResults = await hifi.search(query);

				if (searchResults.items.length === 0) {
					return await wait.update(L.core.errors.noResultsForQuery);
				}

				const total = searchResults.items.length;
				const searchResultsChunk = lodash.chunk(searchResults.items, 30);

				await wait.update(t(locale, 'common.core.progress.songsFound', [query, total]));

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
									body: `${L.core.caption.title} : ${title}\n${L.core.caption.artists} : ${artists.map((v) => v.name).join(', ')}\n${L.core.caption.duration} : ${dayjs(duration * 1000).format('HH:mm:ss')}\n${L.core.labels.released} : ${dayjs(streamStartDate).format('DD/MM/YYYY')}`,
									header: cover,
									footer: `Song ${songNumber} of ${total}`,
									buttons: [
										builder.button.url({ display: `Cover ${songNumber}`, url: cover }),
										builder.button.reply({
											display: L.core.buttons.download,
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

				await wait.update(L.core.progress.pleasePressDownload);
			}
		} catch (error) {
			await wait.update(L.core.errors.somethingWentWrong);
		}
	}
});

const downloadAudio = async (client, data, { from, message, prettyNumber, id, index, wait, locale, L }) => {
	await wait.update(L.core.progress.downloadingMusic);

	const downloadInfo = await hifi.download(id ? id : data.items[index].id);

	loggers.warning(
		`${color('Downloading Hi-Fi Audio from', 'pink')} ${color(downloadInfo.domain, 'orange')} for ${color(prettyNumber, 'lilac')}`
	);

	if (downloadInfo?.error) {
		return await wait.update(t(locale, 'common.core.errors.downloadErrorMusic', [downloadInfo.error]));
	}

	await wait.update(L.core.progress.writingMetadata);

	const buffer = await metadata(downloadInfo.track, downloadInfo.url, downloadInfo.cover);

	await wait.update(L.core.progress.writingMetadataSuccess);
	await delay(2000);
	await wait.update(L.core.progress.sendingFile);

	await client.send(
		from,
		{
			document: buffer,
			fileName: `${downloadInfo.track.artist.name} - ${downloadInfo.track.title}.flac`,
			mimetype: 'audio/flac'
		},
		{ quoted: message }
	);

	await wait.update(t(locale, 'common.core.progress.commandFinishedSingle'));

	loggers.warning(
		`${color('Downloaded Hi-Fi Audio from', 'pink')} ${color(downloadInfo.domain, 'orange')} for ${color(prettyNumber, 'lilac')}`
	);
};
