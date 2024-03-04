import { mediafire } from '../../utils/index.js';

const regex = (url) =>
	/^(https?:\/\/)?(www\.)?mediafire\.com\/(file|view|download)\/[a-zA-Z0-9]+(\/[a-zA-Z0-9_\-.~%]+)?(\/file)?.*$/.test(url);

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'mediafire',
	minifiedDescription: 'Download Mediafire',
	description: 'Download files from Mediafire',
	usage: '!mediafire <url>',
	aliases: ['mf', 'mfire', 'mediaf'],
	category: 'Downloader',
	cooldown: 5,
	limit: 7,
	status: 'enable',
	run: async ({ from, message, query, groupMetadata }, client) => {
		if (!query) {
			return client.instance.reply('You must provide a query.', { from, quoted: message, groupMetadata });
		}

		if (!regex(query)) {
			return client.instance.reply('Please specify a valid Mediafire url.', { from, quoted: message, groupMetadata });
		}

		const result = await mediafire(query);

		if ('error' in result) {
			return client.instance.reply(result.error, { from, quoted: message, groupMetadata });
		}

		await client.instance.reply(
			`${'Mediafire Downloader'.formatHeaders()}
		
Filename: ${result.filename}
Filesize: ${result.filesize}
Filetype: ${result.filetype}
Uploaded: ${result.uploaded}`.formatForm(),
			{ from, quoted: message, groupMetadata }
		);

		await client.instance.send(
			from,
			{
				[result.filetype]: { url: result.dlLink },
				...(result.filetype === 'document' ? { fileName: result.filename, mimetype: result.mimetype } : {})
			},
			{ groupMetadata, quoted: message }
		);
	}
};
