import { bluesky, removeDuplicatesArray } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'bluesky',
	description: 'Download media from Bluesky',
	usage: '!bluesky <url>',
	aliases: ['bsky'],
	category: 'Downloader',
	cooldown: 8,
	limit: 4,
	status: 'enable',
	run: async ({ from, query, message }, client) => {
		if (!query) {
			return await client.instance.reply('You must provide a query.', { from, quoted: message });
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const media = await bluesky.getPost(querie);

			let caption = 'Bluesky Downloader'.formatHeaders() + '\n\n';
			caption += `Fullname : ${media.author.displayName}\n`;
			caption += `Username : ${media.author.username}`;

			const mediaType = media.images ? 'images' : media.videos ? 'videos' : null;

			if (mediaType) {
				for (const item of media[mediaType]) {
					if (item.error) {
						await client.instance.send(from, { text: item.error }, { quoted: message });
						break;
					}

					await client.instance.send(from, { [mediaType.slice(0, -1)]: { url: item }, caption }, { quoted: message });
					caption = '';
				}
			}
		}
	}
};
