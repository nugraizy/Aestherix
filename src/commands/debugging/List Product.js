import { generateWAMessageFromContent } from 'baileys';
import fs from 'fs-extra';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'productlist',
	description: 'Send list product message.',
	category: 'Debugging',
	usage: '!productlist',
	aliases: ['plst'],
	cooldown: 5,
	limit: 0,
	status: 'disable',
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
										productId: '4311556755568341'
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
			{ messageId: client.instance.generateMessageID() }
		);

		await client.instance.relay(from, messages.message, { messageId: messages.key.id });
	}
};
