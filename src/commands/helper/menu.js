import fs from 'fs-extra';

import configuration from '../../helper/config/connect.js';

const getRandomCommand = () =>
	Array.from(configuration.cmds.commands.keys())[Math.floor(Math.random() * configuration.cmds.commands.size)];

const format = {
	'AL-Quran': 'Ａｌ-Ｑｕｒａｎ',
	Anime: 'Ａｎｉｍｅ',
	Anonymous: 'Ａｎｏｎｙｍｏｕｓ',
	Converter: 'Ｃｏｎｖｅｒｔｅｒ',
	Debugging: 'Ｄｅｂｕｇｇｉｎｇ',
	Downloader: 'Ｄｏｗｎｌｏａｄｅｒ',
	Games: 'Ｇａｍｅｓ',
	'Genshin Impact': 'Ｇｅｎｓｈｉｎ Ｉｍｐａｃｔ',
	Helper: 'Ｈｅｌｐｅｒ',
	'Look-up': 'Ｌｏｏｋ-ｕｐ',
	Misc: 'Ｍｉｓｃ',
	Moderation: 'Ｍｏｄｅｒａｔｉｏｎ',
	News: 'Ｎｅｗｓ',
	Owner: 'Ｏｗｎｅｒ',
	Search: 'Ｓｅａｒｃｈ'
};

export default {
	name: 'menu',
	description: 'Shows the menu',
	usage: '!menu',
	aliases: ['help'],
	category: 'Helper',
	cooldown: 10,
	limit: 5,
	status: 'enable',
	async run({ from, prefix, groupMetadata }, client) {
		let capt = `𓆩 Void Bot ⁣𓆪\nV ${(await fs.readJSON('./package.json')).version.toUpperCase()}\n\n`;
		const container = {};

		configuration.cmds.commands.forEach((value, key) => {
			if (value.name !== '') {
				if (Object.keys(container).includes(value.category)) {
					container[value.category].push(key);
				} else {
					container[value.category] = [key];
				}
			}
		});

		for (const key of Object.keys(container).sort((a, b) => a.localeCompare(b))) {
			capt += `⪨ *${format[key]}* ⪩\n\n${container[key]
				.sort((a, b) => a.localeCompare(b))
				.map((v) => ` ⪩ ${prefix}${v}`)
				.join('\n')}\n\n\n`;
		}

		capt = `${capt.trim()}\n\nUse : ${prefix}${getRandomCommand()} -H\n~> to see the detail of the command.\n~> total command : ${
			configuration.cmds.commands.size
		}`;

		await client[botNum].send(
			from,
			{
				text: capt.trim(),
				footer: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪',
				buttons: [{ buttonId: '.about', buttonText: { displayText: 'About Us.' }, type: 1 }],
				headerType: 1
			},
			{ groupMetadata }
		);
	}
};
