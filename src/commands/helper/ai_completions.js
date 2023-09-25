import { Configuration, OpenAIApi } from 'openai';

const updateApikey = () =>
	process.env.OPENAI_KEY.split('\n')[Math.floor(Math.random() * process.env.OPENAI_KEY.split('\n').length)];

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'aicompletions',
	description: 'Ask A.I to complete your sentence or give A.I any task within texts.',
	usage: '!aicompletions <query>',
	aliases: ['complete'],
	category: 'Helper',
	cooldown: 7,
	limit: 7,
	status: 'enable',
	run: async ({ query, from, message, groupMetadata }, client) => {
		if (!query) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'You must provide a query.');
		}

		const configuration = new Configuration({ apiKey: updateApikey() });
		const openai = new OpenAIApi(configuration);

		const completion = await openai.createCompletion({
			model: 'text-davinci-003',
			prompt: query,
			max_tokens: 200 /* eslint-disable-line */
		});

		client[botNum].reply({ groupMetadata, from, quoted: message }, completion.data.choices[0].text.trim());
	}
};
