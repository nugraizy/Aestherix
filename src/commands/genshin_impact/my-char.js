import path from 'path';
import fs from 'fs-extra';

import configuration from '../../helper/config/connect.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'mycharacter',
	minifiedDescription: 'Look-up Genshin Impact Char',
	description: 'Look-up your Genshin Impact character.',
	usage: '!mycharacter',
	aliases: ['mychar'],
	category: 'Genshin Impact',
	cooldown: 6,
	limit: 2,
	status: 'enable',
	async run({ sender, query, message, from }, client) {
		const data = await fs.readJSON(path.join(__dirname, 'databases/games/genshin_impact/data.json'));
		const index = data.findIndex((v) => v.user === sender);

		if (index === -1) {
			return await client.reply(from, 'Your character seems nowhere in the Database.', message);
		}

		query = `${data[index].uid} -char ${query}`;

		await configuration.cmds.commands.get('genshinstalk').run({ sender, query, message, from }, client);
	}
};
