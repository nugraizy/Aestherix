import { createImage } from '../../utils/deepai/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'makeimage',
	description: 'Create an image based on your description',
	usage: '!makeimage <scenario>',
	category: 'Converter',
	aliases: ['createimage', 'makeimg', 'createimg'],
	limit: 2,
	cooldown: 5,
	status: 'enable',
	async run({ query, from, message, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply('You must provide a query.', { from, quoted: message, groupMetadata });
		}

		await client[botNum].reply('Creating. Please wait...', { from, quoted: message, groupMetadata });

		const result = await createImage(query);

		const caption = `${'A.I Image Generator'.formatHeaders()}\n\nPowered by deepai.org`;

		await client[botNum].send(from, { image: { url: result }, caption }, { groupMetadata, quoted: message });
	}
};
