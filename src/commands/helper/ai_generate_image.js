import OpenAI from 'openai';

const updateApikey = () =>
	process.env.OPENAI_KEY.split('\n')[Math.floor(Math.random() * process.env.OPENAI_KEY.split('\n').length)];

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'aiimage',
	minifiedDescription: 'Generate Image',
	description: 'Ask A.I to make an image based on your text.',
	usage: '!aiimage `<query>`',
	aliases: ['aimg'],
	category: 'Helper',
	cooldown: 7,
	limit: 7,
	status: 'enable',
	run: async ({ query, from, message }, client) => {
		if (!query) {
			return await client.reply(from, 'You must provide a query.', message);
		}

		const openai = new OpenAI({ apiKey: updateApikey() });

		const image = await openai.images.generate({
			prompt: query,
			size: '512x512'
		});

		client.send(from, { image: { url: image.data[0].url } }, { quoted: message });
	}
};
