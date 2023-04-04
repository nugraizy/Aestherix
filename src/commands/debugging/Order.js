import { generateWAMessageFromContent } from '@adiwajshing/baileys';
import fs from 'fs-extra';

export default {
	name: 'order',
	description: 'Send order.',
	category: 'Debugging',
	usage: '!order',
	aliases: ['order'],
	cooldown: 5,
	limit: 0,
	status: 'enable',
	async run({ from, sender }, client) {
		const messages = generateWAMessageFromContent(
			from,
			{
				orderMessage: {
					orderId: '538583220623209',
					thumbnail: await fs.readFile('./src/media/blank.png'),
					itemCount: 1,
					status: 1,
					surface: 1,
					message: 'Nanda is a message',
					orderTitle: 'Nanda is a title',
					sellerJid: sender,
					totalAmount1000: 1_000_000_000_000,
					totalCurrencyCode: 'IDR'
				}
			},
			{}
		);

		await client[botNum].relayMessage(from, messages.message, { messageId: messages.key.id });
	}
};
