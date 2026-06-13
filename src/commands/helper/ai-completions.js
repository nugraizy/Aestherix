import OpenAI from 'openai';
import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

const updateApikey = () =>
	process.env.OPENAI_KEY.split('\n')[Math.floor(Math.random() * process.env.OPENAI_KEY.split('\n').length)];

export default defineCommand({
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
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return await client.reply(from, L.errors.noQuery, message);
		}

		const openai = new OpenAI({ apiKey: updateApikey() });

		const completion = await openai.chat.completions.create({
			model: 'text-davinci-003',
			prompt: query,
			max_tokens: 200
		});

		client.reply(from, completion.choices[0].text.trim(), message);
	}
});
