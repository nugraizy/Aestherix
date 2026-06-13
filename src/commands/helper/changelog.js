import fs from 'fs-extra';
import path from 'path';
import parser from 'yargs-parser';

import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { getChangelogs, stringifyChangelogs } from '../../utils/github/index.js';
import { defineCommand } from '../_define.js';

const disable = true;
let image = null;
let isCache = false;

export default defineCommand({
	name: 'changelogs',
	description: 'Get the latest changelogs directly from GitHub',
	usage: '!changelog -q `<number>` / --quantity `<number>`',
	aliases: ['cl', 'changelog'],
	category: 'Helper',
	cooldown: 5,
	limit: 3,
	status: 'enable',
	run: async ({ query, from, message }, client) => {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const { quantity, text } = parser(query, {
			number: 'quantity',
			boolean: 'text',
			configuration: {
				'short-option-groups': false
			},
			alias: {
				quantity: 'q',
				text: 't'
			},
			default: {
				quantity: 5
			}
		});

		if (disable) {
			if (!image && !text) {
				image = await fs.readFile(path.join(__dirname, 'src/media/CHANGELOG.png'));
			}

			await client.send(
				from,
				text
					? { text: await fs.readFile(path.join(__dirname, 'CHANGELOG.md'), { encoding: 'utf-8' }) }
					: { image, caption: (isCache && 'cached image.') || '' },
				{ quoted: message }
			);

			isCache = true;
		}

		if (!quantity) {
			return await client.reply(from, L.errors.quantityRequired, message);
		}

		const changelog = await getChangelogs(quantity);
		const caption = await stringifyChangelogs(changelog);

		await client.reply(from, caption, message);
	}
});
