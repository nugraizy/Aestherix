import parser from 'yargs-parser';

import { mediafire, isURL, removeDuplicatesArray } from '../../utils/index.js';

const regex = (url) =>
	/^(https?:\/\/)?(www\.)?mediafire\.com\/(file|view|download)\/[a-zA-Z0-9]+(\/[a-zA-Z0-9_\-.~%]+)?(\/file)?.*$/.test(url);

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'mediafire',
	minifiedDescription: 'Download Mediafire',
	description: 'Download files from Mediafire',
	usage: '!mediafire `<url(s)>` (you can send multiple url using space in between)',
	aliases: ['mf', 'mfire', 'mediaf'],
	category: 'Downloader',
	cooldown: 5,
	limit: 7,
	status: 'enable',
	run: async ({ from, message, query }, client) => {
		if (!query) {
			return client.instance.reply('You must provide a query.', { from, quoted: message });
		}

		let { _: urls } = parser(query);

		urls = removeDuplicatesArray(urls);

		if (urls.length === 1 && !isURL(urls[0])) {
			return await client.instance.reply('Please specify a valid url', { from, quoted: message });
		}

		if (urls.length === 1 && !regex(urls[0])) {
			return await client.instance.reply('Please specify a valid Mediafire url.', { from, quoted: message });
		}

		await client.instance.reply('Please wait...', { from, quoted: message });

		for (const url of urls) {
			if (!regex(url)) {
				await client.instance.reply('Please specify a valid Mediafire url.\nInvalid : ' + url, {
					from,
					quoted: message
				});
				continue;
			}

			const result = await mediafire(url);

			if (result?.error) {
				return client.instance.reply(result.error, { from, quoted: message });
			}

			await client.instance.reply(
				`${'Mediafire Downloader'.formatHeaders()}
		
Filename: ${result.filename}
Filesize: ${result.filesize}
Filetype: ${result.filetype}
Uploaded: ${result.uploaded}`.formatForm(),
				{ from, quoted: message }
			);

			await client.instance.send(
				from,
				{
					[result.filetype]: { url: result.dlLink },
					...(result.filetype === 'document' ? { fileName: result.filename, mimetype: result.mimetype } : {})
				},
				{ quoted: message }
			);
		}
	}
};
