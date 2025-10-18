import path from 'path';
import fs from 'fs-extra';

import { dab, metadata } from '../../utils/dab/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'dabdownload',
	description: 'Download lolssless music from Tidal via Dab',
	usage: '!dabdl `<query>`',
	aliases: ['dabdl'],
	category: 'Downloader',
	cooldown: 8,
	limit: 3,
	status: 'enable',
	run: async ({ from, query, message, filename }, client) => {
		if (!query) {
			return await client.instance.reply('You must provide a query.', { from, quoted: message });
		}

		await client.instance.reply('Please wait...', { from, quoted: message });

		const searchResults = await dab.search(query);

		if (searchResults.items.length === 0) {
			return await client.instance.reply('No results found for your query. Try again with another keyword.', {
				from,
				quoted: message
			});
		}

		const downloadInfo = await dab.download(searchResults.items[0].id);

		if (downloadInfo?.error) {
			return await client.instance.reply(`Error while downloading music\n\n${downloadInfo.error}`, { from, quoted: message });
		}

		const buffer = await metadata(downloadInfo.track, downloadInfo.url, downloadInfo.cover);

		await client.instance.send(
			from,
			{
				document: buffer,
				fileName: `${downloadInfo.track.artist.name} - ${downloadInfo.track.title}.flac`,
				mimetype: 'audio/flac'
			},
			{ quoted: message }
		);
	}
};
