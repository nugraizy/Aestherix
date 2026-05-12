import parser from 'yargs-parser';

import { mediafire, isURL, removeDuplicatesArray, loggers, color } from '../../utils/index.js';

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
	run: async ({ from, message, query, prettyNumber }, client) => {
		if (!query) {
			return client.reply(from, 'You must provide a query.', message);
		}

		let { _: urls } = parser(query);

		urls = removeDuplicatesArray(urls);

		if (urls.length === 1 && !isURL(urls[0])) {
			return await client.reply(from, 'Please specify a valid url.', message);
		}

		if (urls.length === 1 && !regex(urls[0])) {
			return await client.reply(from, 'Please specify a valid Mediafire url.', message);
		}

		const wait = await client.waitMessage(from, 'Please wait...', message);

		let success = 0;
		let error = 0;

		loggers.warning(`${color('Downloading Mediafire File', 'pink')} for ${color(prettyNumber, 'lilac')}`);

		for (const url of urls) {
			if (!regex(url)) {
				await client.reply(from, 'Please specify a valid Mediafire url.\nInvalid : ' + url, message);
				error++;
				continue;
			}

			const result = await mediafire(url);

			if (result?.error) {
				client.reply(from, result.error, message);
				loggers.error(`${color('Failed to Download Mediafire File', 'red')} for ${color(prettyNumber, 'lilac')}`);
				error++;
				return;
			}

			await client.reply(
				from,
				`${'Mediafire Downloader'.formatHeaders()}
		
Filename: ${result.filename}
Filesize: ${result.filesize}
Filetype: ${result.filetype}
Uploaded: ${result.uploaded}`.formatForm(),
				message
			);

			await client.send(
				from,
				{
					[result.filetype]: { url: result.dlLink },
					...(result.filetype === 'document' ? { fileName: result.filename, mimetype: result.mimetype } : {})
				},
				{ quoted: message }
			);
			success++;
		}

		await wait.update(`Command Finished. With total ${success} success, and ${error} fail.`);

		loggers.info(`${color('Downloaded Mediafire File', 'pink')} for ${color(prettyNumber, 'lilac')}`);
	}
};
