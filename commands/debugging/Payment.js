/* global botNum */
import { generateMessageID, generateWAMessageFromContent } from '@adiwajshing/baileys';

export default {
	name: 'payment',
	description: 'Send payment texts.',
	usage: '!payment',
	aliases: ['pm'],
	category: 'Debugging',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	run: async ({ isOwner, from }, client) => {
		if (!isOwner) {
			return;
		}

		const messages = client[botNum].generateWAMessageFromContent(from, {});
	},
};
