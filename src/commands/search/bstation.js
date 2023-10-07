import { removeDuplicatesArray } from '../../utils/modules/index.js';
import { bilibiliSearchTv } from '../../utils/bilibili/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'bstation',
	description: 'Search videos from Bilibili/Bstation ID Server',
	usage: '!bstation <query>',
	category: 'Search',
	aliases: ['bstat', 'blindo'],
	limit: 4,
	cooldown: 7,
	status: 'enable',
	async run({ query, from, message, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply('You must provide a query.', { from, quoted: message, groupMetadata });
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const videos = await bilibiliSearchTv(querie.trim());

			console.log(videos);
		}
	}
};
