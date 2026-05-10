import OpenAI from 'openai';

const updateApikey = () =>
	process.env.OPENAI_KEY.split('\n')[Math.floor(Math.random() * process.env.OPENAI_KEY.split('\n').length)];

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'aicompletions',
	minifiedDescription: 'AI Completions',
	description: 'Ask A.I to complete your sentence or give A.I any task within texts.',
	usage: '!aicompletions `<query>`',
	aliases: ['complete'],
	category: 'Helper',
	cooldown: 7,
	limit: 7,
	status: 'enable',
	run: async ({ query, from, message }, client) => {
		if (!query) {
			return await client.instance.reply(from, 'You must provide a query.', message);
		}

		const openai = new OpenAI({ apiKey: updateApikey() });

		const completion = await openai.chat.completions.create({
			model: 'text-davinci-003',
			prompt: query,
			max_tokens: 200
		});

		client.instance.reply(from, completion.choices[0].text.trim(), message);
	}
};
