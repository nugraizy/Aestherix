/* global botNum */
import { mediafire } from '../../utils/index.js';

const regex = (url) => /^(https?:\/\/)?(www\.)?mediafire\.com\/(file|view|download)\/[a-zA-Z0-9]+(\/[a-zA-Z0-9_\-.~%]+)?(\/file)?.*$/.test(url);

export default {
	name: 'mediafire',
	description: 'Download files from Mediafire',
	usage: '!mediafire <url>',
	aliases: ['mf', 'mfire', 'mediaf'],
	category: 'Downloader',
	cooldown: 5,
	limit: 7,
	status: 'enable',
	run: async ({ from, message, query }, client) => {
		if (!query) {
			return client[botNum].reply({ from, quoted: message }, 'You must provide a query.');
		}

		if (!regex(query)) {
			return client[botNum].reply({ from, quoted: message }, 'You must provide a query.');
		}

		const result = await mediafire(query);

		if ('error' in result) {
			return client[botNum].reply({ from, quoted: message }, result.error);
		}

		client[botNum].reply(
			{ from, quoted: message },
			`\`\`\` • Mediafire Downloader\`\`\`
		
Filename: ${result.filename}
Filesize: ${result.filesize}
Filetype: ${result.filetype}
Uploaded: ${result.uploaded}`,
		);
		client[botNum].sendMessage(
			from,
			{ [result.filetype]: { url: result.dlLink }, ...(result.filetype === 'document' ? { fileName: result.filename, mimetype: result.mimetype } : {}) },
			{ quoted: message },
		);
	},
};
