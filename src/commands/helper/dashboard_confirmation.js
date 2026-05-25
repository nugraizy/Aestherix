import { processDashboardConfirmationAction } from '../../../dashboard/server/socket/confirmation.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
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
			return await client.reply(from, 'Invalid dashboard confirmation code.', message);
		}

		if (confirmation.approved) {
			return await client.reply(from, 'Dashboard login confirmation accepted. You can return to the browser now.', message);
		}

		return await client.reply(from, confirmation.message || 'Dashboard confirmation failed.', message);
	}
});
