import { generateWAMessageFromContent, delay } from '@adiwajshing/baileys';

import { getWaifu } from '../../utils/index.js';

export default {
	name: 'loading',
	description: 'Loading.',
	category: 'Debugging',
	usage: '!loading',
	aliases: ['load'],
	cooldown: 5,
	limit: 0,
	status: 'enable',
	async run({ from, groupMetadata }, client) {
		let caption = '';
		const frames = [
			'⢀⠀',
			'⡀⠀',
			'⠄⠀',
			'⢂⠀',
			'⡂⠀',
			'⠅⠀',
			'⢃⠀',
			'⡃⠀',
			'⠍⠀',
			'⢋⠀',
			'⡋⠀',
			'⠍⠁',
			'⢋⠁',
			'⡋⠁',
			'⠍⠉',
			'⠋⠉',
			'⠋⠉',
			'⠉⠙',
			'⠉⠙',
			'⠉⠩',
			'⠈⢙',
			'⠈⡙',
			'⢈⠩',
			'⡀⢙',
			'⠄⡙',
			'⢂⠩',
			'⡂⢘',
			'⠅⡘',
			'⢃⠨',
			'⡃⢐',
			'⠍⡐',
			'⢋⠠',
			'⡋⢀',
			'⠍⡁',
			'⢋⠁',
			'⡋⠁',
			'⠍⠉',
			'⠋⠉',
			'⠋⠉',
			'⠉⠙',
			'⠉⠙',
			'⠉⠩',
			'⠈⢙',
			'⠈⡙',
			'⠈⠩',
			'⠀⢙',
			'⠀⡙',
			'⠀⠩',
			'⠀⢘',
			'⠀⡘',
			'⠀⠨',
			'⠀⢐',
			'⠀⡐',
			'⠀⠠',
			'⠀⢀',
			'⠀⡀'
		];
		const message = await client[botNum].send(from, { text: `${frames[0]} loading image. please wait.` }, { groupMetadata });

		const waifu = (await getWaifu('waifu', 'sfw'))[0];

		for (const frame of frames) {
			caption = `${frame} loading image. please wait.`;
			const messages = generateWAMessageFromContent(
				from,
				{
					editedMessage: {
						message: {
							protocolMessage: {
								key: {
									remoteJid: message.key.remoteJid,
									fromMe: true,
									id: message.key.id
								},
								type: 'MESSAGE_EDIT',
								editedMessage: {
									conversation: caption
								},
								timestampMs: '1680418593103'
							}
						}
					}
				},
				{}
			);

			client[botNum].relayMessage(from, messages.message, {
				messageId: messages.key.id,
				cachedGroupMetadata: () => groupMetadata
			});

			await delay(80);
		}

		caption = 'loading complete. here is your image!';
		const messages = generateWAMessageFromContent(
			from,
			{
				editedMessage: {
					message: {
						protocolMessage: {
							key: {
								remoteJid: message.key.remoteJid,
								fromMe: true,
								id: message.key.id
							},
							type: 'MESSAGE_EDIT',
							editedMessage: {
								conversation: caption
							},
							timestampMs: '1680418593103'
						}
					}
				}
			},
			{}
		);

		await client[botNum].relayMessage(from, messages.message, {
			messageId: messages.key.id,
			cachedGroupMetadata: () => groupMetadata
		});
		await client[botNum].send(from, { image: { url: waifu } }, { groupMetadata });
	}
};
