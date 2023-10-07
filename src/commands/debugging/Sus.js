import { delay } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'sus',
	description: 'sus',
	category: 'Debugging',
	usage: '!sus',
	aliases: ['sus'],
	cooldown: 5,
	limit: 0,
	status: 'enable',
	async run({ isOwner, from, query }, client, store) {
		if (!isOwner) {
			return;
		}

		const stores = store.messages[from].array.map((v) => v.key.id);

		for (const stored of stores) {
			await client[botNum].relayMessage(from, { conversation: query || 'yeet' }, { messageId: stored });
			await delay(300);
		}
	}
};
