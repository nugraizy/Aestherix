import { BOT_NAME } from '../../core/constants.js';

import yargsParser from 'yargs-parser';

import { brainlySearch } from '../../utils/brainly/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'brainly',
	minifiedDescription: 'Search Brainly',
	description: 'Search answers from brainly.',
	usage: '!brainly `<query>` `-<?lang (oneof id, us, es, ru, ro, pt, tr, ph, pl, hi)>`  -<?count (min 1 - max 30)> ',
	category: 'Search',
	aliases: ['brainli', 'brainly-search', 'tugas'],
	limit: 4,
	cooldown: 7,
	status: 'enable',
	async run({ query, from, message }, client) {
		if (!query) {
			return await client.reply(from, 'You must provide a query', message);
		}

		const parseOptions = yargsParser(query, {
			configuration: {
				'short-option-groups': false
			}
		});
		const options = { lang: undefined, count: undefined };

		delete parseOptions._;
		options.lang = Object.keys(parseOptions).find((v) => /\w{2,2}/i.test(v))?.[0] || undefined;
		options.count = Object.keys(parseOptions).find((v) => /\d{2,2}/i.test(v))?.[0] || undefined;
		const brainly = await brainlySearch(query, options);

		if (brainly?.error) {
			return await client.reply(from, brainly.error, message);
		}

		let capt = 'Brainly'.formatHeaders();

		capt += '\n\n';

		for (const { pertanyaan, jawaban } of brainly) {
			capt += `Pertanyaan : ${pertanyaan.replace(/[\n\t\r]/g, '')}\n`;
			capt += `Jawaban : ${jawaban
				.map((item, index) => `\n${index + 1}. ${item.replace(/[\n\t\r]/g, '')}\n`)
				.join('')
				.trim()}\n\n\n`;
		}

		capt += `\nBrainly by ${BOT_NAME}. Powered by Hidden Finder`;
		await client.reply(from, capt.trim().formatForm(), message);
	}
});
