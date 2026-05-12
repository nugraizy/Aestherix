import { manager } from '../../core/manager.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'listbots',
	description: 'List all active bot instances.',
	usage: '!listbots',
	aliases: ['bots'],
	category: 'Owner',
	cooldown: 3,
	limit: 0,
	status: 'enable',
	restrict: false,
	premium: false,

	async run({ from, message, isOwner }, client) {
		if (!isOwner) {
			return;
		}

		const entries = manager.list();

		if (entries.length === 0) {
			return client.reply(from, 'No bots running.', message);
		}

		const lines = entries.map((entry, i) => {
			const status = entry.client.state === 'connected' ? '🟢' : '🔴';
			const phone = entry.client.phone ?? 'not paired';
			const role = entry.client.role === 'primary' ? '👑' : '🤖';
			const uptime = entry.client.uptime ?? '-';

			return `${i + 1}. ${status} ${role} *${entry.name}* (${phone}) · ${uptime}`;
		});

		return client.reply(from, `🤖 *Active bots:*\n\n${lines.join('\n')}`, message);
	}
};
