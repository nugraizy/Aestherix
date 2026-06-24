import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { templateManager } from '../../helper/template.js';
import { defineCommand } from '../_define.js';
import { getPrefix } from '../../helper/modules/prefix.js';

export default defineCommand({
	name: 'template',
	minifiedDescription: 'Message templates',
	description: 'Create and use message templates.',
	usage: '!template `<save/use/list/remove>`',
	category: 'Misc',
	aliases: ['tpl'],
	cooldown: 2,
	limit: 1,
	status: 'enable',
	async run({ from, message, query, args, sender }, client) {
		const locale = await getLocale(from);
		const prefix = getPrefix();
		const T = useLocale(locale, 'template', { prefix });

		if (!query) {
			return await client.reply(from, T.template.usage, message);
		}

		if (args[1] === 'list') {
			const templateList = templateManager.list(from);

			if (templateList.length === 0) {
				return await client.reply(from, T.template.noTemplates, message);
			}

			const list = templateList
				.map((tpl, i) =>
					t(locale, 'template.template.listItem', [String(i + 1), tpl.name, String(tpl.useCount), tpl.id])
				)
				.join('\n');

			await client.reply(from, `${T.template.listTitle}\n\n${list}`, message);
		} else if (args[1] === 'remove') {
			const nameMatch = query.match(/remove\s+"([^"]+)"/);

			if (!nameMatch) {
				return await client.reply(from, T.errors.provideName, message);
			}

			const name = nameMatch[1];
			const success = templateManager.removeByName(from, name);

			if (success) {
				await client.reply(from, t(locale, 'template.template.removed', [name]), message);
			} else {
				await client.reply(from, t(locale, 'template.errors.notFound', [name]), message);
			}
		} else if (args[1] === 'save') {
			const match = query.match(/save\s+"([^"]+)"\s+"([^"]+)"/);

			if (!match) {
				return await client.reply(from, T.errors.provideNameContent, message);
			}

			const name = match[1];
			const content = match[2];

			const existing = templateManager.get(from, name);

			if (existing) {
				existing.content = content;
				await client.reply(from, t(locale, 'template.template.updated', [name]), message);
			} else {
				templateManager.add(from, sender, name, content);
				await client.reply(from, t(locale, 'template.template.saved', [name]), message);
			}
		} else if (args[1] === 'use') {
			const nameMatch = query.match(/use\s+"([^"]+)"/);

			if (!nameMatch) {
				return await client.reply(from, T.errors.provideName, message);
			}

			const name = nameMatch[1];
			const variables = {};

			const varMatches = query.matchAll(/(\w+)="([^"]+)"/g);

			for (const match of varMatches) {
				if (match[1] !== name) {
					variables[match[1]] = match[2];
				}
			}

			const content = templateManager.use(from, name, variables);

			if (content) {
				await client.reply(from, content, message);
			} else {
				await client.reply(from, t(locale, 'template.errors.notFound', [name]), message);
			}
		} else {
			await client.reply(from, T.errors.invalidArgs, message);
		}
	}
});
