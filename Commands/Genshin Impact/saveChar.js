/* global botNum */
import path from 'path';

import { __dirname } from '../../connect.js';
import { readJSON, writeJSON } from '../../Helper/Modules/index.js';
import { genshinProfile } from '../../Utils/Games/index.js';

const regex = async (input) => {
	const match = input.match(/^\d{9,10}/g);

	if (!match) {
		return { status: false, message: 'Wasn\'t a valid UID' };
	}

	if (!(await genshinProfile(match[0]))) {
		return { status: false, message: 'We can\'t find your char' };
	}

	return { status: true, message: match[0] };
};

export default {
	name: 'savechar',
	description: 'Save your Genshin Impact character',
	usage: '!savechar <uids>',
	aliases: ['saveuid'],
	category: 'Genshin Impact',
	cooldown: 6,
	limit: 2,
	status: 'enable',
	async run({ sender, query, message, from }, client) {
		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'Please specify an UID');
		}

		const data = readJSON(path.join(__dirname, 'Databases/Games/Genshin Impact/data.json'));
		const index = data.findIndex((v) => v.user == sender);

		if (index !== -1) {
			return await client[botNum].reply({ from, quoted: message }, 'Your character already in Database.');
		}

		const findUid = await regex(query);

		if (!findUid.status) {
			return await client[botNum].reply({ from, quoted: message }, findUid.message);
		}

		data.push({
			user: sender,
			uid: findUid.message,
		});
		writeJSON(path.join(__dirname, 'Databases/Games/Genshin Impact/data.json'), data);

		await client[botNum].reply({ from, quoted: message }, 'Your char is saved');
	},
};
