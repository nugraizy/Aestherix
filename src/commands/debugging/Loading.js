import axios from 'axios';
import { generateWAMessageFromContent } from '@adiwajshing/baileys';

import { getWaifu } from '../../utils/index.js';

const loading = async (frame, from, message, client, groupMetadata) => {
	let caption = `${frame || ''} loading image. please wait.`;
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
						}
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
};

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

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
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

		const message = await client[botNum].send(from, { text: `${frames[0]} loading image. please wait.` }, { groupMetadata });

		const waifu = (await getWaifu('waifu', 'sfw'))[0];

		let progress = 0;
		const { data: buffer } = await axios.get(waifu, {
			responseType: 'arraybuffer',
			onDownloadProgress: async () => {
				await loading(frames[progress], from, message, client, groupMetadata);

				if (progress === frames.length - 1) {
					progress = 0;
				} else {
					progress++;
				}
			}
		});

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
							}
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
		await client[botNum].send(from, { image: new Buffer.from(buffer, 'base64') }, { groupMetadata });
	}
};
