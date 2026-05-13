import fs from 'fs-extra';
import path from 'path';
import parser from 'yargs-parser';

import { gttsAI, toOpus } from '../../utils/converter/index.js';

const voices = await fs.readJSON(path.join(__dirname, 'databases/model/voices.json'));
const boxen = (text) => {
	const texts = text.split('\n');
	let box = `╭───╌┄ ${texts[0]} ┄┄╌────\n`;

	box += texts
		.slice(1)
		.map((v) => `│ ${v}`)
		.join('\n');
	box += '\n╰────┄┄';

	return box;
};

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'aitts',
	minifiedDescription: 'TTS V2',
	description: 'Convert text to speech with real people voice over it',
	usage: '!aitts `<query>`',
	aliases: ['aitt', 'aispeech'],
	category: 'Converter',
	cooldown: 5,
	limit: 1,
	status: 'enable',
	run: async ({ query, from, type, message, /*cmd,*/ args, filename }, client) => {
		if (!query) {
			return await client.reply(from, 'Please provide some text to convert to speech', message);
		}

		if (type === 'listResponseMessage') {
			const result = await gttsAI(args.slice(2).join(' '), args[1]);

			if (result?.error) {
				return await client.reply(from, result.error, message);
			}

			const audioBuffer = await toOpus('opus', {
				input: path.join(__dirname, `src/media/temporary_files/${filename}`),
				output: path.join(__dirname, `src/media/temporary_files/${filename}-done`),
				media: result.url.replace('https', 'http')
			});

			client.send(from, { audio: Buffer.from(audioBuffer, 'base64') }, { quoted: message });

			return;
		}

		let { _: queries, model } = parser(query, {
			alias: {
				model: ['m']
			},
			configuration: {
				'short-option-groups': false
			}
		});

		if (typeof model === 'boolean') {
			const container = {};

			voices.forEach(({ category, name, display_name: displayName, is_active: isActive }, index) => {
				if (Object.keys(container).includes(category)) {
					container[category].push({
						name,
						displayName,
						isActive,
						index
					});
				} else {
					container[category] = [
						{
							name,
							displayName,
							isActive,
							index
						}
					];
				}
			});

			let caption = 'AI Text-To-Speech Models'.formatHeaders();

			for (const key in container) {
				caption += `\n\n${key.formatHeaders()}\n`;
				caption += container[key]
					.map((v) => {
						if (v.isActive) {
							return boxen(`${v.displayName}\nIndex : ${v.index}`);
						}

						return null;
					})
					.filter(Boolean)
					.join('\n')
					.trimEnd();
			}

			await client.reply(from, caption, message);

			return;
		}

		model = model && voices[model] ? voices[model].voicemodel_uuid : '92022a27-75fb-4e15-90ca-95095a82f5ee';

		const result = await gttsAI(queries.join(' '), model);

		if (result?.error) {
			return await client.reply(from, result.error, message);
		}

		const audioBuffer = await toOpus('opus', {
			input: path.join(__dirname, `src/media/temporary_files/${filename}`),
			output: path.join(__dirname, `src/media/temporary_files/${filename}-done`),
			media: result.url.replace('https', 'http')
		});

		await client.send(from, { audio: Buffer.from(audioBuffer, 'base64') }, { quoted: message });

		// const container = {};
		// const row = [];

		// voices.forEach(({ category, name, display_name: displayName, is_active: isActive }) => {
		// 	if (Object.keys(container).includes(category)) {
		// 		container[category].push({
		// 			name,
		// 			displayName,
		// 			isActive
		// 		});
		// 	} else {
		// 		container[category] = [
		// 			{
		// 				name,
		// 				displayName,
		// 				isActive,
		// 				index: 0
		// 			}
		// 		];
		// 	}
		// });

		// for (const key in container) {
		// 	container[key] = container[key].sort((a, b) => a.displayName.localeCompare(b.displayName));
		// 	row.push({
		// 		rows: [
		// 			{
		// 				title: `${container[key][0].displayName}`,
		// 				rowId: `${cmd} ${container[key][0].name} ${query}`
		// 			},
		// 			...container[key].slice(1).map((v) => ({
		// 				title: `${v.displayName}`,
		// 				rowId: `${cmd} ${v.name} ${query}`
		// 			}))
		// 		],
		// 		title: key
		// 	});
		// }

		// await client.send(
		// 	from,
		// 	{
		// 		title: 'Text-To-Speech A.I'.formatHeaders(),
		// 		text: '\n',
		// 		footer: 'choose one of the title inside of the list to see the available streaming services.',
		// 		buttonText: 'Open List',
		// 		sections: row
		// 	},
		// 	{  }
		// );
	}
};
