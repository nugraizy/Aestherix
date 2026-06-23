import { BOT_NAME } from '../../core/constants.js';

import fs from 'fs-extra';

import configuration from '../../helper/config/connect.js';
import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
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
		const locale = await getLocale(from);
		const Lh = useLocale(locale, 'helper');
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
			capt += t(locale, 'helper.labels.noCategoryFound', [query]);
		}

		capt = `${capt.trim()}\n\n${Lh.labels.use} : ${prefix}${getRandomCommand(
			Object.values(configuration.registry.menu).flat()
		)} \`${'-H'}\`\n${Lh.labels.arrow} \`${Lh.labels.toSeeDetail}\`\n${Lh.labels.totalCommandsFooter} : \`${configuration.registry.commands.size}\`\n\n${Lh.labels.poweredBy}\n${Lh.labels.greaterThan}`;

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
