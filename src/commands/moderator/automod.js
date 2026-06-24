import { getAutomodRules, setAutomodRules } from '../../helper/groups/settings/group-settings.js';
import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { getPrefix } from '../../helper/modules/prefix.js';
import { defineCommand } from '../_define.js';

const VALID_TYPES = ['spam', 'caps', 'links', 'flood'];
const VALID_ACTIONS = ['warn', 'kick', 'delete'];

function buildList(rules) {
	if (!rules.length) {
		return 'No auto-moderation rules configured.';
	}

	const lines = rules.map((r) => {
		const status = r.enabled ? 'ON' : 'OFF';

		return `[${r.id}] ${r.type} — threshold: ${r.threshold}, duration: ${r.duration}s, action: ${r.action} (${status})`;
	});

	return `Auto-Moderation Rules:\n${lines.join('\n')}`;
}

export default defineCommand({
	name: 'automod',
	minifiedDescription: 'Manage auto-moderation rules for groups',
	description: 'Add, remove, list, or toggle auto-moderation rules that automatically enforce group moderation.',
	category: 'Moderation',
	usage: '.automod add <type> <threshold> <duration> <action>\n.automod remove <id>\n.automod list\n.automod toggle <id>',
	aliases: ['am'],
	cooldown: 5,
	limit: 1,
	status: 'enable',
	restrict: false,
	run: async ({ from, message, args, isGroup, isAdmin }, client) => {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!isGroup) {
			return await client.reply(from, 'This command is for groups only.', message);
		}

		if (!isAdmin) {
			return await client.reply(from, 'You are not an admin.', message);
		}

		const sub = args[1];

		if (!sub || sub === 'help') {
			const prefix = getPrefix();

			return await client.reply(
				from,
				`Auto-Moderation Commands:\n\n` +
					`${prefix}automod add <type> <threshold> <duration> <action> — Add a rule\n` +
					`${prefix}automod remove <id> — Remove a rule\n` +
					`${prefix}automod list — List all rules\n` +
					`${prefix}automod toggle <id> — Enable/disable a rule\n\n` +
					`Types: spam, caps, links, flood\n` +
					`Actions: warn, kick, delete\n\n` +
					`Example: ${prefix}automod add spam 5 60 kick`,
				message
			);
		}

		const rules = await getAutomodRules(from);

		if (sub === 'list') {
			return await client.reply(from, buildList(rules), message);
		}

		if (sub === 'add') {
			const type = args[2];
			const threshold = parseInt(args[3], 10);
			const duration = parseInt(args[4], 10);
			const action = args[5];

			if (!type || !VALID_TYPES.includes(type)) {
				return await client.reply(from, `Invalid type. Valid: ${VALID_TYPES.join(', ')}`, message);
			}

			if (!threshold || threshold < 1) {
				return await client.reply(from, 'Threshold must be a positive number.', message);
			}

			if (!duration || duration < 1) {
				return await client.reply(from, 'Duration must be a positive number (seconds).', message);
			}

			if (!action || !VALID_ACTIONS.includes(action)) {
				return await client.reply(from, `Invalid action. Valid: ${VALID_ACTIONS.join(', ')}`, message);
			}

			const rule = {
				id: Date.now().toString(36),
				type,
				threshold,
				duration,
				action,
				enabled: true
			};

			rules.push(rule);
			await setAutomodRules(from, rules);

			return await client.reply(
				from,
				`Rule added:\n[${rule.id}] ${rule.type} — ${rule.threshold} messages in ${rule.duration}s → ${rule.action}`,
				message
			);
		}

		if (sub === 'remove') {
			const id = args[2];

			if (!id) {
				return await client.reply(from, 'Provide a rule ID.', message);
			}

			const idx = rules.findIndex((r) => r.id === id);

			if (idx === -1) {
				return await client.reply(from, `No rule with ID: ${id}`, message);
			}

			rules.splice(idx, 1);
			await setAutomodRules(from, rules);

			return await client.reply(from, `Rule ${id} removed.`, message);
		}

		if (sub === 'toggle') {
			const id = args[2];

			if (!id) {
				return await client.reply(from, 'Provide a rule ID.', message);
			}

			const rule = rules.find((r) => r.id === id);

			if (!rule) {
				return await client.reply(from, `No rule with ID: ${id}`, message);
			}

			rule.enabled = !rule.enabled;
			await setAutomodRules(from, rules);

			return await client.reply(from, rule.enabled ? t(locale, 'common.moderation.enabled', [id]) : t(locale, 'common.moderation.disabled', [id]), message);
		}

		await client.reply(from, `Unknown subcommand: ${sub}. Use "help" for usage.`, message);
	}
});
