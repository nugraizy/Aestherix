import { BOT_NAME } from '../../core/constants.js';

import fs from 'fs-extra';

import configuration from '../../helper/config/connect.js';
import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { defineCommand } from '../_define.js';

const { version } = await fs.readJSON('./package.json');
const getRandomCommand = (cmd) => cmd[Math.floor(Math.random() * cmd.length)].name;

const CATEGORY_ORDER = [
	'AI',
	'AL-Quran',
	'Anime',
	'Anonymous',
	'Converter',
	'Debugging',
	'Downloader',
	'Games',
	'Genshin Impact',
	'Helper',
	'Look-up',
	'Misc',
	'Moderation',
	'News',
	'Owner',
	'Search'
];

const CATEGORY_FORMAT = {
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

function parseFlags(query) {
	const flags = { desc: false, all: false, filter: '' };

	if (!query) {
		return flags;
	}

	const parts = query.split(/\s+/);

	for (const part of parts) {
		if (part === '--desc') {
			flags.desc = true;
		} else if (part === '--all') {
			flags.all = true;
		} else if (!part.startsWith('--')) {
			flags.filter = flags.filter ? `${flags.filter} ${part}` : part;
		}
	}

	return flags;
}

function buildMenuContainer() {
	const container = {};
	const commands = configuration.registry.commands.filter((value) => value.name !== '', 'filter');

	for (const category of CATEGORY_ORDER) {
		const cmds = commands.filter((v) => v.category === category, 'filter');

		if (cmds.length > 0) {
			container[category] = cmds.sort((a, b) => a.name.localeCompare(b.name));
		}
	}

	return container;
}

function formatCategoryHeader(category) {
	return `> ✦ ${CATEGORY_FORMAT[category] || category} ー`;
}

function formatCommandList(commands, prefix, locale, showDesc) {
	return commands
		.map((v) => {
			if (showDesc) {
				const resolvedMinified = t(locale, `commands.${v.name}.minified`) || v.minifiedDescription || v.description;

				return `╭ ${resolvedMinified}\n├ _${prefix}${v.name}_\n├ ${v.usage}\n╰ ⏳ ${v.cooldown}s | ${
					v.premium ? 'Premium' : 'Free'
				} | 🆔 ${v.aliases.join(', ')}`;
			}

			return `\`${prefix}\` ${v.name}`;
		})
		.join('\n');
}

function formatAllMenu(menu, categories, prefix, locale, showDesc) {
	let capt = `\`${BOT_NAME} ー ${version}\`\n\n`;

	for (const category of categories) {
		capt += `${formatCategoryHeader(category)}\n`;
		capt += formatCommandList(menu[category], prefix, locale, showDesc);
		capt += '\n\n\n';
	}

	return capt;
}

export default defineCommand({
	name: 'menu',
	minifiedDescription: 'Show Bot Menu',
	description: 'Shows the menu.',
	descriptionArgs: ['`--desc`', '`--all`', '`games`'],
	usage: '!menu [--desc] [--all] [category]',
	aliases: ['help'],
	category: 'Helper',
	cooldown: 5,
	limit: 0,
	status: 'enable',
	async run({ from, prefix, message, query }, client) {
		const locale = await getLocale(from);
		const Lh = useLocale(locale, 'helper');
		const flags = parseFlags(query);

		if (!Object.keys(configuration.registry.menu).length) {
			configuration.registry.menu = buildMenuContainer();
		}

		const categories = CATEGORY_ORDER.filter((c) => configuration.registry.menu[c]);
		const filteredCategories = flags.filter
			? categories.filter((c) => c.toLowerCase().includes(flags.filter.toLowerCase()))
			: categories;

		if (filteredCategories.length === 0) {
			await client.reply(from, t(locale, 'helper.labels.noCategoryFound', [flags.filter]), message);

			return;
		}

		if (flags.all) {
			let capt = formatAllMenu(configuration.registry.menu, filteredCategories, prefix, locale, flags.desc);

			capt += `${Lh.labels.use} : ${prefix}${getRandomCommand(
				Object.values(configuration.registry.menu).flat()
			)} \`${'-H'}\`\n${Lh.labels.arrow} \`${Lh.labels.toSeeDetail}\`\n${Lh.labels.totalCommandsFooter} : \`${configuration.registry.commands.size}\`\n\n${Lh.labels.poweredBy}\n${Lh.labels.greaterThan}`;

			await client.send(
				from,
				{ text: capt.trim() },
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

			return;
		}

		const category = filteredCategories[0];
		const idx = categories.indexOf(category);
		const commands = configuration.registry.menu[category];

		let capt = `\`${BOT_NAME} ー ${version}\`\n\n`;

		capt += `${formatCategoryHeader(category)}\n`;
		capt += formatCommandList(commands, prefix, locale, flags.desc);
		capt += `\n\n> ${idx + 1}/${categories.length}`;

		const builder = new client.TemplateBuilder.Native();
		const buttons = [];

		if (idx > 0) {
			buttons.push(
				builder.button.reply({ display: '◀ Previous', id: cmdId(`menu ${categories[idx - 1]} ${flags.desc ? '--desc' : ''}`) })
			);
		}

		if (idx < categories.length - 1) {
			buttons.push(
				builder.button.reply({ display: '▶ Next', id: cmdId(`menu ${categories[idx + 1]} ${flags.desc ? '--desc' : ''}`) })
			);
		}

		buttons.push(builder.button.reply({ display: '📋 All', id: cmdId(`menu --all ${flags.desc ? '--desc' : ''}`) }));

		await builder
			.destination(from)
			.body(capt)
			.buttons(...buttons)
			.send({ quoted: message });
	}
});
