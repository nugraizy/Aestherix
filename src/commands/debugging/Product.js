import { generateWAMessage, generateWAMessageFromContent } from 'baileys';
import fs from 'fs-extra';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'product',
	description: 'Send product.',
	category: 'Debugging',
	usage: '!product',
	aliases: ['prd'],
	cooldown: 5,
	limit: 0,
	status: 'enable',
	async run({ from, sender }, client) {
		const messages = await generateWAMessage(
			from,
			{ image: await fs.readFile('./src/media/blank.png') },
			{ upload: client.waUploadToServer }
		);

		const content = generateWAMessageFromContent(
			from,
			{
				productMessage: {
					product: {
						productImage: messages.message.imageMessage,
						productId: 'Nanda is a product id',
						title: 'Nanda is a title',
						description: 'Nanda is a product description.',
						currencyCode: 'IDR',
						priceAmount1000: 1_000_000,
						retailerId: 'Made by Hidden Finder',
						url: 'https://github.com/nugraizy/Aestherix',
						productImageCount: 1,
						salePriceAmount1000: 1_000_000
					},
					catalog: {
						catalogImage: messages.message.imageMessage,
						title: 'Nanda is a title',
						description: 'Nanda is a catalog description.'
					},
					businessOwnerJid: sender,
					body: 'Nanda is a body',
					footer: 'Nanda is a footer'
				}
			},
			{ messageId: client.generateMessageID() }
		);

		await client.relay(from, content.message, { messageId: content.key.id });
	}
});
