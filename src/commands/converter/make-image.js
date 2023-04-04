import { createImage } from '../../utils/deepai/index.js';

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
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'You must provide a query.');
		}

		await client[botNum].reply({ from, quoted: message }, 'Creating. Please wait...');

		const result = await createImage(query);

		const caption = `${'A.I Image Generator'.formatHeaders()}\n\nPowered by deepai.org`;

		await client[botNum].send(from, { image: { url: result }, caption }, { groupMetadata, quoted: message });
	}
};
