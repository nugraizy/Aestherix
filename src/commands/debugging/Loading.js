import { generateWAMessageFromContent } from '@adiwajshing/baileys';
import numeral from 'numeral';

import { getWaifu, Fetch, isURL, audioFormat, imageFormat, videoFormat } from '../../utils/index.js';

const frames = ['▓', '▒'];

const totalBars = 15; // Set the total number of bars

const createLoadingBar = (progress) => {
	const percentage = Math.floor(progress.percentage);
	const barCount = Math.floor((percentage / 100) * totalBars);
	const emptyCount = totalBars - barCount;

	const bar = frames[0].repeat(barCount);
	const empty = frames[1].repeat(emptyCount);

	const barText = `${bar}${empty}`;

	const text = `╭[${barText}] ${numeral(percentage).format('0.00')}%\n╰ ETA ${numeral(progress.eta).format(
		'00:00:00'
	)} ${numeral(progress.speed).format('0.00b')}/s`;

	return text;
};

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
	async run({ from, groupMetadata, query }, client) {
		if (!isURL(query) && query) {
			return await client[botNum].send(from, { text: 'Please provide a valid URL.' }, { groupMetadata });
		}

		let caption = '';

		const message = await client[botNum].send(from, { text: 'loading media. please wait.' }, { groupMetadata });

		if (!query) {
			query = (await getWaifu('waifu', 'sfw'))[0];
		}

		const { origin } = new URL(query);

		const clientFetch = new Fetch(origin, {
			delay: 100
		});

		const req = await clientFetch.request(query.replace(origin, ''), {
			method: 'GET'
		});

		req.on('finish', async (isFinish100Percent) => {
			if (isFinish100Percent) {
				caption = 'Loading Complete. Here is your media!\n' + createLoadingBar({ percentage: 100 });
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

				const buffer = req.toBuffer();
				const mediaType = videoFormat.includes(req.headers['content-type'])
					? 'video'
					: imageFormat.includes(req.headers['content-type'])
					? 'image'
					: audioFormat.includes(req.headers['content-type'])
					? 'audio'
					: 'document';

				const timeOnProcess = Date.now();

				await client[botNum].send(
					from,
					{
						[mediaType]: new Buffer.from(buffer, 'base64'),
						caption: '*Buffer Type*',
						benchmark: true,
						timeOnProcess
					},
					{ groupMetadata }
				);
			}
		});

		req.on('progress', async (progress) => {
			let caption = 'Loading media. Please wait.\n' + createLoadingBar(progress);
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
		});
	}
};
