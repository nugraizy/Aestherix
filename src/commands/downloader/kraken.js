import parser from 'yargs-parser';

import { kraken, removeDuplicatesArray, loggers, color } from '../../utils/index.js';

const regex = (url) => /^(https?:\/\/)?(www\.)?krakenfiles\.com\/(view)\/[a-zA-Z0-9]+(\/[a-zA-Z0-9_\-.~%]+)?\.html$/.test(url);

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
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
			return client.instance.reply('You must provide a query.', { from, quoted: message });
		}

		const { _: urls } = parser(query);

		urls = removeDuplicatesArray(urls);

		await client.instance.reply('Please wait...', { from, quoted: message });

		loggers.warning(`${color('Downloading Kraken File', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);

		for (const url of urls) {
			if (!regex(url)) {
				await client.instance.reply('Please specify a valid Kraken url.\nInvalid : ' + url, { from, quoted: message });
				continue;
			}

			const result = await kraken(url);

			if (result?.error) {
				await client.instance.reply(result.error, { from, quoted: message });
				loggers.error(`${color('Failed to Download Kraken File', '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`);
				continue;
			}

			await client.instance.reply(
				`${'Kraken Downloader'.formatHeaders()}
		
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

		loggers.info(`${color('Downloaded Kraken File', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);
	}
};
