import fs from 'fs-extra';

import configuration from '../../helper/config/connect.js';

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
	async run({ from, prefix, message, query }, client) {
		let capt = `\`Aestherix ー ${version}\`\n\n`;

		if (!Object.keys(configuration.cmds.menu).length) {
			const container = configuration.cmds.commands
				.filter((value) => value.name !== '', 'filter')
				.reduce((acc, value) => {
					acc[value.category] = (acc[value.category] || []).concat(value);
					return acc;
				}, {});

			configuration.cmds.menu = container;
		}

		let isFound = false;

		for (const category in configuration.cmds.menu) {
			if (query && !category.toLowerCase().includes(query.toLowerCase())) {
				continue;
			}

			const sortedCommands = configuration.cmds.menu[category]
				.sort((a, b) => a.name.localeCompare(b.name))
				.map((v, i, arr /* eslint-disable-line */) => {
					const commonPart = isNeedDescription
						? `╭ ${v.minifiedDescription || v.description}\n├ _${prefix}${v.name}_\n├ ${v.usage}\n╰ ⏳ ${v.cooldown}s | ${
								v.premium ? 'Premium' : 'Free'
						  } | 🆔 ${v.aliases.join(', ')}` // eslint-disable-line
						: (() => {
								const [cmd, ...rest] = v.usage.split(' ');

								let capt = `> ${i + 1}.) ${cmd}`;

								if (rest.length) {
									capt += ` _\`${rest.join(' ')}\`_`;
								}

								return capt;
						  })(); // eslint-disable-line

					return commonPart;
				})
				.join('\n');

			capt += `> _✦ ${format[category]}_ ー\n${sortedCommands}\n\n\n`;

			if (query) {
				isFound = true;
				break;
			}
		}

		if (!isFound && query) {
			capt += `Could not find any category with the name "\`${query}\`"\n\n`;
		}

		capt = `${capt.trim()}\n\nUse : ${prefix}${getRandomCommand(
			Object.values(configuration.cmds.menu).flat()
		)} \`-H\`\nー> \`To see the detail of the command.\`\nー> Total Commands : \`${
			configuration.cmds.commands.size
		}\`\n\nＰｏｗｅｒｅｄ ｂｙ\n> 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ`;

		configuration.cmds.menuStr = capt;

		await client.instance.send(
			from,
			{
				text: capt.trim()
				// footer: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪',
				// buttons: [{ buttonId: '.about', buttonText: { displayText: 'About Us.' }, type: 1 }],
				// headerType: 1
			},
			{
				quoted: message,
				contextInfo: {
					isForwarded: true,
					forwardedNewsletterMessageInfo: {
						newsletterJid: 'aestherix@newsletter',
						newsletterName: 'Ｐｏｗｅｒｅｄ ｂｙ 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ',
						serverMessageId: 103
					}
				}
			}
		);
	}
};
