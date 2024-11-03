import parser from 'yargs-parser';
import fs from 'fs-extra';

import { getChangelogs, stringifyChangelogs } from '../../utils/github/index.js';

const disable = true;

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'changelogs',
	description: 'Get the latest changelogs directly from GitHub',
	usage: '!changelog -q <number> / --quantity <number>',
	aliases: ['cl', 'changelog'],
	category: 'Helper',
	cooldown: 5,
	limit: 3,
	status: 'enable',
	run: async ({ query, from, message }, client) => {
		if (disable) {
			return await client.instance.send(from, { image: await fs.readFile('./CHANGELOG.png') }, { quoted: message });
		}

		const { quantity } = parser(query, {
			number: ['quantity'],
			configuration: {
				'short-option-groups': false
			},
			alias: {
				quantity: ['q']
			},
			default: {
				quantity: 5
			}
		});

		if (!quantity) {
			return await client.instance.reply('You must provide a quantity.', { from, quoted: message });
		}

		const changelog = await getChangelogs(quantity);

		await client.instance.reply(stringifyChangelogs(changelog), { from, quoted: message });
	}
};
