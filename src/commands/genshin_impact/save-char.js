import path from 'path';
import fs from 'fs-extra';

import { genshinProfile } from '../../utils/games/index.js';

const regex = async (input) => {
	const match = input.match(/^\d{9,10}/g);

	if (!match) {
		return { status: false, message: 'Not a valid UID' };
	}

	if (!(await genshinProfile(match[0]))) {
		return { status: false, message: 'We can not find your char' };
	}

	return { status: true, message: match[0] };
};

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'savechar',
	description: 'Save your Genshin Impact character',
	usage: '!savechar <uids>',
	aliases: ['saveuid'],
	category: 'Genshin Impact',
	cooldown: 6,
	limit: 2,
	status: 'enable',
	async run({ sender, query, message, from, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply('Please specify an UID', { from, quoted: message, groupMetadata });
		}

		const data = await fs.readJSON(path.join(__dirname, 'databases/games/genshin_impact/data.json'));
		const index = data.findIndex((v) => v.user === sender);

		if (index !== -1) {
			return await client[botNum].reply('Your character already in Database.', { from, quoted: message, groupMetadata });
		}

		const findUid = await regex(query);

		if (!findUid.status) {
			return await client[botNum].reply(findUid.message, { from, quoted: message, groupMetadata });
		}

		data.push({
			user: sender,
			uid: findUid.message
		});
		await fs.writeJSON(path.join(__dirname, 'databases/games/genshin_impact/data.json'), data);

		await client[botNum].reply('Your char is saved', { from, quoted: message, groupMetadata });
	}
};
