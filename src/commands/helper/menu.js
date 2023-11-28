import fs from 'fs-extra';

import configuration from '../../helper/config/connect.js';

const getRandomCommand = (cmd) => cmd[Math.floor(Math.random() * cmd.length)].name;

const format = {
	AI: 'ＡＩ',
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
const { version } = await fs.readJSON('./package.json');

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'menu',
	minifiedDescription: 'Bot Menu',
	description: 'Shows the menu.',
	usage: '!menu',
	aliases: ['help'],
	category: 'Helper',
	cooldown: 10,
	limit: 5,
	status: 'enable',
	async run({ from, prefix, groupMetadata }, client) {
		let capt = `𓆩 𝓗𝓲𝓭𝓭𝓮𝓷 𝓕𝓲𝓷𝓭𝓮𝓻 ${version} 𓆪\n\n`;

		if (Object.keys(configuration.cmds.menu).length === 0) {
			const container = configuration.cmds.commands
				.filter((value) => value.name !== '', 'filter')
				.reduce((acc, value) => {
					acc[value.category] = (acc[value.category] || []).concat(value);
					return acc;
				}, {});

			configuration.cmds.menu = container;
		}

		for (const category in configuration.cmds.menu) {
			const sortedCommands = configuration.cmds.menu[category]
				.sort(
					/**
					 * @param {import('../../types/Commands/index.js').CommandProps} a
					 * @param {import('../../types/Commands/index.js').CommandProps} b
					 * @returns {import('../../types/Commands/index.js').CommandProps[]}
					 */
					(a, b) => a.name.localeCompare(b.name)
				)
				.map(
					/**
					 * @param {import('../../types/Commands/index.js').CommandProps} v
					 */
					(v) =>
						`╭ ${v.minifiedDescription}\n├ _${prefix}${v.name}_\n├ ${v.usage}\n╰ ⏳ ${v.cooldown}s | ${
							v.premium ? 'Premium' : 'Free'
						} | 🆔 ${v.aliases.join(', ')}`
				)
				.join('\n');

			capt += `${format[category].formatHeaders()}\n\n${sortedCommands}\n\n\n`;
		}

		capt = `${capt.trim()}\n\nUse : ${prefix}${getRandomCommand(
			Object.values(configuration.cmds.menu).flat()
		)} -H\n~> to see the detail of the command.\n~> total command : ${configuration.cmds.commands.size}`;

		configuration.cmds.menuStr = capt;

		await client.instance.send(
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
