import path from 'path';
import fs from 'fs-extra';

import configuration from '../../helper/config/connect.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'mystats',
	minifiedDescription: 'Look-up Genshin Impact Stats',
	description: 'Look-up your Genshin Impact statistic',
	usage: '!mystats',
	aliases: ['myuid'],
	category: 'Genshin Impact',
	cooldown: 6,
	limit: 2,
	status: 'enable',
	async run({ sender, query, message, from, groupMetadata }, client) {
		const data = await fs.readJSON(path.join(__dirname, 'databases/games/genshin_impact/data.json'));
		const index = data.findIndex((v) => v.user === sender);

		if (index === -1) {
			return await client.instance.reply('Your character seems nowhere in the Database.', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		query = `${data[index].uid} -uid`;

		await configuration.cmds.commands.get('genshinstalk').run({ sender, query, message, from, groupMetadata }, client);
	}
};
