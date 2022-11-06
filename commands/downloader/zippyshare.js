/* global botNum */
import { zippyshare } from '../../utils/index.js';

const regex = (url) => /(https?:\/\/(.+?\.)?zippyshare\.com(\/[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=]*)?)/gm.test(url);

export default {
	name: 'zippyshare',
	description: 'Download files from Zippyshare.',
	usage: '!zippyshare <url>',
	aliases: ['zs', 'zippy', 'zshare'],
	category: 'Downloader',
	cooldown: 5,
	limit: 7,
	status: 'enable',
	run: async ({ from, message, query }, client) => {
		if (!query) {
			return client[botNum].reply({ from, quoted: message }, 'You must provide a query.');
		}

		if (!regex(query)) {
			return client[botNum].reply({ from, quoted: message }, 'Please specify a valid Zippyshare url.');
		}

		const result = await zippyshare(query);

		if ('error' in result) {
			return client[botNum].reply({ from, quoted: message }, result.error);
		}

		client[botNum].reply(
			{ from, quoted: message },
			`\`\`\` • Zippyshare Downloader\`\`\`
		
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
