/* global botNum */
import { Configuration, OpenAIApi } from 'openai';

const updateApikey = () => process.env.OPENAI_KEY.split('\n')[Math.floor(Math.random() * process.env.OPENAI_KEY.split('\n').length)];

export default {
	name: 'aiimage',
	description: 'Ask A.I to make an image based on your text.',
	usage: '!aiimage <query>',
	aliases: ['aimg'],
	category: 'Helper',
	cooldown: 7,
	limit: 7,
	status: 'enable',
	run: async ({ query, from, message }, client) => {
		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'You must provide a query.');
		}

		const configuration = new Configuration({ apiKey: updateApikey() });
		const openai = new OpenAIApi(configuration);

		const image = await openai.createImage({
			prompt: query,
			size: '512x512',
		});

		client[botNum].sendMessage(from, { image: { url: image.data.data[0].url } }, { quoted: message });
	},
};
