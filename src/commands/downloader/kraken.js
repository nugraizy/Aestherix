import { kraken } from '../../utils/index.js';

const regex = (url) => /^(https?:\/\/)?(www\.)?krakenfiles\.com\/(view)\/[a-zA-Z0-9]+(\/[a-zA-Z0-9_\-.~%]+)?\.html$/.test(url);

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'kraken',
	minifiedDescription: 'Download Kraken',
	description: 'Download files from Kraken',
	usage: '!kraken <url>',
	aliases: ['kkn'],
	category: 'Downloader',
	cooldown: 5,
	limit: 7,
	status: 'enable',
	run: async ({ from, message, query }, client) => {
		if (!query) {
			return client.instance.reply('You must provide a query.', { from, quoted: message });
		}

		if (!regex(query)) {
			return client.instance.reply('Please specify a valid Kraken url.', { from, quoted: message });
		}

		const result = await kraken(query);

		if ('error' in result) {
			return client.instance.reply(result.error, { from, quoted: message });
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
};
