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
	minifiedDescription: 'Save Genshin Impact Character',
	description: 'Save your Genshin Impact character.',
	usage: '!savechar `<uids>`',
	aliases: ['saveuid'],
	category: 'Genshin Impact',
	cooldown: 6,
	limit: 2,
	status: 'enable',
	async run({ sender, query, message, from }, client) {
		if (!query) {
			return await client.reply(from, 'Please specify an UID', message);
		}

		const data = await fs.readJSON(path.join(__dirname, 'databases/games/genshin_impact/data.json'));
		const index = data.findIndex((v) => v.user === sender);

		if (index !== -1) {
			return await client.reply(from, 'Your character already in Database.', message);
		}

		const findUid = await regex(query);

		if (!findUid.status) {
			return await client.reply(from, findUid.message, message);
		}

		data.push({
			user: sender,
			uid: findUid.message
		});
		await fs.writeJSON(path.join(__dirname, 'databases/games/genshin_impact/data.json'), data);

		await client.reply(from, 'Your char is saved', message);
	}
};
