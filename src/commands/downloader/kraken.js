import parser from 'yargs-parser';

import { kraken, removeDuplicatesArray, loggers, color } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

const regex = (url) => /^(https?:\/\/)?(www\.)?krakenfiles\.com\/(view)\/[a-zA-Z0-9]+(\/[a-zA-Z0-9_\-.~%]+)?\.html$/.test(url);

export default defineCommand({
	name: 'kraken',
	minifiedDescription: 'Download Kraken',
	description: 'Download files from Kraken',
	usage: '!kraken `<url(s)>` (you can send multiple url using space in between)',
	aliases: ['kkn'],
	category: 'Downloader',
	cooldown: 5,
	limit: 7,
	status: 'enable',
	run: async ({ from, message, query, prettyNumber }, client) => {
		if (!query) {
			return client.reply(from, 'You must provide a query.', message);
		}

		const { _: urls } = parser(query);

		urls = removeDuplicatesArray(urls);

		const wait = await client.waitMessage(from, 'Please wait...', message);

		let success = 0;
		let error = 0;

		loggers.warning(`${color('Downloading Kraken File', 'pink')} for ${color(prettyNumber, 'lilac')}`);

		for (const url of urls) {
			if (!regex(url)) {
				await client.reply(from, 'Please specify a valid Kraken url.\nInvalid : ' + url, message);
				error++;
				continue;
			}

			const result = await kraken(url);

			if (result?.error) {
				await client.reply(from, result.error, message);
				loggers.error(`${color('Failed to Download Kraken File', 'red')} for ${color(prettyNumber, 'lilac')}`);
				error++;
				continue;
			}

			await client.reply(
				from,
				`${'Kraken Downloader'.formatHeaders()}
		
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

		loggers.info(`${color('Downloaded Kraken File', 'pink')} for ${color(prettyNumber, 'lilac')}`);
	}
});
