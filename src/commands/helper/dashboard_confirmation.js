import { processDashboardConfirmationAction } from '../../helper/connection/dashboard/server.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'dashconfirm',
	minifiedDescription: 'Dashboard Confirmation',
	description: 'Approve or reject dashboard login confirmations via WhatsApp.',
	usage: '!dashconfirm <dashauth:confirm|reject:requestId:token>',
	aliases: ['dashboardconfirm', 'dashauth'],
	category: 'Helper',
	cooldown: 5,
	limit: 0,
	status: 'enable',
	async run({ from, message, query, sender, isOwner }, client) {
		if (!isOwner) {
			return;
		}

		const confirmation = await processDashboardConfirmationAction({
			actionId: query,
			senderJid: sender
		});

		if (!confirmation.handled) {
			return await client.instance.reply(from, 'Invalid dashboard confirmation code.', message);
		}

		if (confirmation.approved) {
			return await client.instance.reply(
				from,
				'Dashboard login confirmation accepted. You can return to the browser now.',
				message
			);
		}

		return await client.instance.reply(from, confirmation.message || 'Dashboard confirmation failed.', message);
	}
};
