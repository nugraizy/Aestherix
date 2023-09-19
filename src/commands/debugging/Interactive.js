/* eslint-disable */

import { generateWAMessageFromContent } from '@adiwajshing/baileys';
import fs from 'fs-extra';

import { randomChar } from '../../utils/index.js';

const container = () => ({
	order: {
		shipping: {
			value: 150000,
			offset: 1
		},
		status: 'pending',
		items: [
			{
				amount: {
					offset: 1,
					value: 5000000
				},
				name: 'Test',
				quantity: 1,
				retailer_id: 'custom-item-1694865264'
			}
		],
		discount: {
			value: 50000,
			offset: 1
		},
		subtotal: {
			value: 5000000,
			offset: 1
		},
		tax: {
			value: 12375,
			offset: 1
		}
	},
	total_amount: {
		offset: 1,
		value: 5112375
	},
	reference_id: '4MVS' + randomChar('abcdefghijklmnopqrstuvwxyz0123456789', 11 - 4).toUpperCase(),
	currency: 'IDR',
	external_payment_configurations: [
		{
			type: 'payment_instruction',
			payment_instruction: 'Haloo'
		}
	],
	type: 'physical-goods'
});

export default {
	name: 'interactive',
	description: 'Send interactive.',
	category: 'Debugging',
	usage: '!interactive',
	aliases: ['inter'],
	cooldown: 5,
	limit: 0,
	status: 'enable',
	async run({ from }, client) {
		const image = await client[botNum].prepareMedia(await fs.readFile('./src/media/blank.png'), 'imageMessage');

		const messages = generateWAMessageFromContent(
			from,
			{
				interactiveMessage: {
					nativeFlowMessage: {
						buttons: [
							{
								name: 'review_and_pay',
								buttonParamsJson: JSON.stringify(container())
							}
						]
					}
				}
			},
			{}
		);

		console.log(JSON.stringify(messages, null, 2));
		await client[botNum].relayMessage(from, messages.message, { messageId: messages.key.id });
	}
};
