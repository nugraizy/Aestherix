import fs from 'fs-extra';
import path from 'path';

import { gttsAI, toOpus } from '../../utils/converter/index.js';

const voices = await fs.readJSON(path.join(__dirname, 'databases/model/voices.json'));

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'aitts',
	description: 'Convert text to speech with real people voice over it',
	usage: '!aitts <query>',
	aliases: ['aitt', 'aispeech'],
	category: 'Converter',
	cooldown: 5,
	limit: 1,
	status: 'enable',
	run: async ({ query, from, type, message, cmd, args, filename, groupMetadata }, client) => {
		if (!query) {
			return await client[botNum].reply('Please provide some text to convert to speech', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		if (type === 'listResponseMessage') {
			const result = await gttsAI(args.slice(2).join(' '), args[1]);

			if ('error' in result) {
				return await client[botNum].reply(result.error, { from, quoted: message, groupMetadata });
			}

			const audioBuffer = await toOpus('opus', {
				input: path.join(__dirname, `src/media/temporary_files/${filename}`),
				output: path.join(__dirname, `src/media/temporary_files/${filename}-done`),
				media: result.url.replace('https', 'http')
			});

			client[botNum].send(from, { audio: Buffer.from(audioBuffer, 'base64') }, { groupMetadata, quoted: message });

			return;
		}

		const container = {};
		const row = [];

		voices.forEach(({ category, name, display_name: displayName, is_active: isActive }) => {
			if (Object.keys(container).includes(category)) {
				container[category].push({
					name,
					displayName,
					isActive
				});
			} else {
				container[category] = [
					{
						name,
						displayName,
						isActive,
						index: 0
					}
				];
			}
		});

		for (const key in container) {
			container[key] = container[key].sort((a, b) => a.displayName.localeCompare(b.displayName));
			row.push({
				rows: [
					{
						title: `${container[key][0].displayName}`,
						rowId: `${cmd} ${container[key][0].name} ${query}`
					},
					...container[key].slice(1).map((v) => ({
						title: `${v.displayName}`,
						rowId: `${cmd} ${v.name} ${query}`
					}))
				],
				title: key
			});
		}

		await client[botNum].send(
			from,
			{
				title: 'Text-To-Speech A.I'.formatHeaders(),
				text: '\n',
				footer: 'choose one of the title inside of the list to see the available streaming services.',
				buttonText: 'Open List',
				sections: row
			},
			{ groupMetadata }
		);
	}
};
