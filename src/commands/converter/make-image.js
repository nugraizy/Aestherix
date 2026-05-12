import { createImage } from '../../utils/ai/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'makeimage',
	minifiedDescription: 'Create Image',
	description: 'Create an image based on your description',
	usage: '!makeimage `<scenario>`',
	category: 'Converter',
	aliases: ['createimage', 'makeimg', 'createimg'],
	limit: 2,
	cooldown: 5,
	status: 'disable',
	async run({ query, from, message }, client) {
		if (!query) {
			return await client.reply(from, 'You must provide a query.', message);
		}

		await client.reply(from, 'Creating. Please wait...', message);

		const result = await createImage(query);

		const caption = `${'A.I Image Generator'.formatHeaders()}\n\nPowered by deepai.org`;

		await client.send(from, { image: { url: result }, caption }, { quoted: message });
	}
};
