import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { getCustomAliases, setCustomAliases } from '../../helper/groups/settings/group-settings.js';
import configuration from '../../helper/config/connect.js';
import { defineCommand } from '../_define.js';

const MAX_ALIASES = 20;

export default defineCommand({
	name: 'alias',
	minifiedDescription: 'Manage Group Aliases',
	description: 'Add, remove, or list custom command aliases for this group.',
	usage: '{prefix}alias add <short> <command>\n{prefix}alias remove <short>\n{prefix}alias list',
	aliases: ['aliases'],
	category: 'Moderation',
	cooldown: 5,
	limit: 1,
	status: 'enable',
	restrict: true,
	async run(ctx, client) {
		const { from, args, isGroup, message } = ctx;
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common', { prefix: ctx.prefix });

		if (!isGroup) {
			return await client.reply(from, L.errors.groupOnly, message);
		}

		const sub = (args[1] || '').toLowerCase();
		const sessionName = configuration.settings?.main_session || 'aestherix-bot';
		const aliases = await getCustomAliases(from, sessionName);

		if (sub === 'add') {
			const shortName = (args[2] || '').toLowerCase();
			const targetCmd = (args[3] || '').toLowerCase();

			if (!shortName || !targetCmd) {
				return await client.reply(from, L.alias.errors.provideNames, message);
			}

			if (Object.keys(aliases).length >= MAX_ALIASES) {
				return await client.reply(from, L.alias.errors.maxReached.replace('{0}', MAX_ALIASES), message);
			}

			const { commands, aliases: globalAliases } = configuration.registry;
			const targetExists = commands.has(targetCmd) || globalAliases.includes(targetCmd);

			if (!targetExists) {
				return await client.reply(from, `Command "${targetCmd}" not found. Use the exact command name or its alias.`, message);
			}

			aliases[shortName] = targetCmd;
			await setCustomAliases(from, aliases, sessionName);

			return await client.reply(from, L.alias.success.added.replace('{0}', shortName).replace('{1}', targetCmd), message);
		}

		if (sub === 'remove') {
			const shortName = (args[2] || '').toLowerCase();

			if (!shortName) {
				return await client.reply(from, L.alias.errors.provideName, message);
			}

			if (!aliases[shortName]) {
				return await client.reply(from, L.alias.errors.notFound.replace('{0}', shortName), message);
			}

			delete aliases[shortName];
			await setCustomAliases(from, aliases, sessionName);

			return await client.reply(from, L.alias.success.removed.replace('{0}', shortName), message);
		}

		if (sub === 'list') {
			const entries = Object.entries(aliases);

			if (!entries.length) {
				return await client.reply(from, L.alias.info.empty, message);
			}

			const list = entries.map(([short, cmd]) => `• ${ctx.prefix}${short} → ${ctx.prefix}${cmd}`).join('\n');

			return await client.reply(from, `${L.alias.info.listTitle}\n${list}`, message);
		}

		return await client.reply(from, L.alias.errors.invalidSub, message);
	}
});
