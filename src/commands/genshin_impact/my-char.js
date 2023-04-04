import path from 'path';
import fs from 'fs-extra';

import configuration from '../../helper/config/connect.js';

export default {
	name: 'mycharacter',
	description: 'Look-up your Genshin Impact character',
	usage: '!mycharacter',
	aliases: ['mychar'],
	category: 'Genshin Impact',
	cooldown: 6,
	limit: 2,
	status: 'enable',
	async run({ sender, query, message, from, groupMetadata }, client) {
		const data = await fs.readJSON(path.join(__dirname, 'databases/games/genshin_impact/data.json'));
		const index = data.findIndex((v) => v.user === sender);

		if (index === -1) {
			return await client[botNum].reply(
				{ groupMetadata, from, quoted: message },
				'Your character seems nowhere in the Database.'
			);
		}

		query = `${data[index].uid} -char ${query}`;

		await configuration.cmds.commands.get('genshinstalk').run({ sender, query, message, from, groupMetadata }, client);
	}
};
