import { generateWAMessageFromContent } from '@adiwajshing/baileys';
import fs from 'fs-extra';

export default {
	name: 'productlist',
	description: 'Send list product message.',
	category: 'Debugging',
	usage: '!productlist',
	aliases: ['plst'],
	cooldown: 5,
	limit: 0,
	status: 'enable',
	async run({ from, query, sender }, client) {
		const row = Array(Number(query || 1)).fill({
			rows: [
				{
					title: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪',
					rowId: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪'
				}
			],
			title: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪'
		});

		const messages = generateWAMessageFromContent(
			from,
			{
				listMessage: {
					buttonText: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪',
					description: 'List Message',
					listType: 2,
					footerText: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪',
					sections: row,
					productListInfo: {
						productSections: [
							{
								title: 'Nanda',
								products: [
									{
										productId: 'productId[0]'
									},
									{
										productId: 'productId[1]'
									}
								]
							}
						],
						headerImage: {
							productId: 'productId',
							jpegThumbnail: await fs.readFile('./src/media/blank.png')
						},
						businessOwnerJid: sender
					}
				}
			},
			{}
		);

		await client[botNum].relayMessage(from, messages.message, { messageId: messages.key.id });
	}
};
