/* global botNum */
import yargsParser from 'yargs-parser';

import { brainlySearch } from '../../utils/brainly/index.js';

export default {
	name: 'brainly',
	description: 'Search answers from brainly',
	usage: '!brainly <query> -<?lang> (id, us, es, ru, ro, pt, tr, ph, pl, hi) -<?count> (1-30)',
	category: 'Search',
	aliases: ['brainli', 'brainly-search', 'tugas'],
	limit: 4,
	cooldown: 7,
	status: 'enable',
	async run({ query, from, message }, client) {
		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'You must provide a query');
		}

		const parseOptions = yargsParser(query, {
			configuration: {
				'short-option-groups': false,
			},
		});
		const options = { lang: undefined, count: undefined };

		delete parseOptions._;
		options.lang = Object.keys(parseOptions).find((v) => /\w{2,2}/i.test(v))?.[0] || undefined;
		options.count = Object.keys(parseOptions).find((v) => /\d{2,2}/i.test(v))?.[0] || undefined;
		const brainly = await brainlySearch(query, options);

		if ('error' in brainly) {
			return await client[botNum].reply({ from, quoted: message }, brainly.error);
		}

		let capt = '``` • Brainly```\n\n';

		for (const { pertanyaan, jawaban } of brainly) {
			capt += `Pertanyaan : ${pertanyaan.replace(/[\n\t\r]/g, '')}\n`;
			capt += `Jawaban : ${jawaban
				.map((item, index) => `\n${index + 1}. ${item.replace(/[\n\t\r]/g, '')}\n`)
				.join('')
				.trim()}\n\n\n`;
		}

		capt += '\nBrainly by Void Bot. Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪';
		await client[botNum].reply({ from, quoted: message }, capt.trim());
	},
};
