import { BOT_NAME } from '../../core/constants.js';

import fs from 'fs-extra';

import configuration from '../../helper/config/connect.js';
import { defineCommand } from '../_define.js';

const { version } = await fs.readJSON('./package.json');
const getRandomCommand = (cmd) => cmd[Math.floor(Math.random() * cmd.length)].name;

const isNeedDescription = false;
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

export default defineCommand({
	name: 'menu',
	minifiedDescription: 'Bot Menu',
	description: 'Shows the menu.',
	usage: '!menu',
	aliases: ['help'],
	category: 'Helper',
	cooldown: 10,
	limit: 5,
	status: 'enable',
	async run({ from, prefix, message, query }, client) {
		let capt = `\`${BOT_NAME} ー ${version}\`\n\n`;

		if (!Object.keys(configuration.registry.menu).length) {
			const container = configuration.registry.commands
				.filter((value) => value.name !== '', 'filter')
				.reduce((acc, value) => {
					acc[value.category] = (acc[value.category] || []).concat(value);
					return acc;
				}, {});

			configuration.registry.menu = container;
		}

		let isFound = false;

		for (const category in configuration.registry.menu) {
			if (query && !category.toLowerCase().includes(query.toLowerCase())) {
				continue;
			}

			const sortedCommands = configuration.registry.menu[category]
				.sort((a, b) => a.name.localeCompare(b.name))
				.map((v) => {
					const commonPart = isNeedDescription
						? `╭ ${v.minifiedDescription || v.description}\n├ _${prefix}${v.name}_\n├ ${v.usage}\n╰ ⏳ ${v.cooldown}s | ${
								v.premium ? 'Premium' : 'Free'
							} | 🆔 ${v.aliases.join(', ')}`
						: (() => {
								let capt = `\`${prefix}\` ${v.name}`;

								return capt;
							})();

					return commonPart;
				})
				.join('\n');

			capt += `> ✦ ${format[category]} ー\n${sortedCommands}\n\n\n`;

			if (query) {
				isFound = true;
				break;
			}
		}

		if (!isFound && query) {
			capt += `Could not find any category with the name "\`${query}\`"\n\n`;
		}

		capt = `${capt.trim()}\n\nUse : ${prefix}${getRandomCommand(
			Object.values(configuration.registry.menu).flat()
		)} \`-H\`\nー> \`To see the detail of the command.\`\nー> Total Commands : \`${
			configuration.registry.commands.size
		}\`\n\nＰｏｗｅｒｅｄ ｂｙ\n> Hidden Finder`;

		configuration.registry.menuStr = capt;

		await client.send(
			from,
			{
				text: capt.trim()
				// footer: 'Powered by Hidden Finder',
				// buttons: [{ buttonId: '.about', buttonText: { displayText: 'About Us.' }, type: 1 }],
				// headerType: 1
			},
			{
				quoted: message,
				contextInfo: {
					isForwarded: true,
					forwardedNewsletterMessageInfo: {
						newsletterJid: 'aestherix@newsletter',
						newsletterName: 'Powered by Hidden Finder',
						serverMessageId: 103
					}
				}
			}
		);
	}
});
