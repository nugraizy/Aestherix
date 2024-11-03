import { generateWAMessageFromContent } from 'baileys';
import numeral from 'numeral';
import yn from 'yn';

import { getWaifu, Fetch, isURL, audioFormat, imageFormat, videoFormat } from '../../utils/index.js';
import { Cache } from '../../helper/modules/cache.js';

const frames = ['▓', '▒'];

const totalBars = 15;

const createLoadingBar = (progress) => {
	const percentage = Math.floor(progress.percentage);
	const barCount = Math.floor((percentage / 100) * totalBars);
	const emptyCount = totalBars - barCount;

	const bar = frames[0].repeat(barCount);
	const empty = frames[1].repeat(emptyCount);

	const barText = `${bar}${empty}`;

	const text = `╭[${barText}] ${numeral(progress.percentage).format('0.00')}%\n[${progress.index}] ── ETA ${numeral(
		progress.eta
	).format('00:00:00')}  ─  ${numeral(progress.speed).format('0.00b')}/s`;

	return text;
};

const downloader = new Cache();

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'loading',
	minifiedDescription: 'Load a File',
	description: 'Loading.',
	category: 'Debugging',
	usage: '!loading',
	aliases: ['load'],
	cooldown: 5,
	limit: 0,
	status: 'enable',
	async run({ from, query, waitForInput, sender }, client) {
		if (!isURL(query) && query) {
			return await client.instance.send(from, { text: 'Please provide a valid URL.' }, {});
		}

		if (downloader.has(sender)) {
			const wait = await waitForInput(
				client,
				{
					expectedType: ['conversation', 'extendedTextMessage'],
					from,
					sender,
					message: 'Please wait for the previous process to finish.\nOr do you want to cancel the previous download?',
					timeInSecond: 15
				},
				{}
			);

			if (wait.timeout) {
				return await client.instance.send(from, { text: 'Timeout.' }, { quoted: wait.quoted });
			}

			const isCancel = yn(wait.message);

			if (isCancel === undefined) {
				return await client.instance.send(from, { text: 'Invalid input.' }, { quoted: wait.quoted });
			}

			const downloadSession = downloader.get(sender);

			if (isCancel) {
				for (const session of downloadSession) {
					session.cancel();
				}

				downloader.delete(sender);
				return await client.instance.send(from, { text: 'Previous download canceled.' }, { quoted: wait.quoted });
			} else {
				return await client.instance.send(from, { text: 'Previous download will continue.' }, { quoted: wait.quoted });
			}
		}

		if (!query) {
			query = (await getWaifu('waifu', 'sfw'))[0];
		}

		query = query.split(',').map((v) => v.trim());

		let container = [];

		for (const url of query) {
			if (!isURL(url)) {
				return await client.instance.send(from, { text: 'Please provide a valid URL.' }, {});
			}

			const { origin } = new URL(url);

			const clientFetch = new Fetch(origin, {
				delay: 100
			});

			container.push(
				clientFetch.request(url.replace(origin, ''), {
					method: 'GET'
				})
			);
		}

		const downloads = await Promise.all(container);

		downloader.set(sender, downloads);

		let completed = 0;
		let load = [];
		let captionLoading =
			'Loading media. Please wait.\n' +
			[...Array(downloads.length)].map((v, i) => createLoadingBar({ percentage: 0, index: i })).join('\n');

		const message = await client.instance.send(from, {
			text: captionLoading
		});

		const timeOnProcess = Date.now();

		downloads.forEach((req, i) => {
			load.push(createLoadingBar({ percentage: 0, index: i }));

			req.on('finish', async (isFinish100Percent, index = i) => {
				if (isFinish100Percent) {
					if (completed + 1 === downloads.length) {
						downloader.delete(sender);
						captionLoading = 'Loading Complete. Here is your media!\n' + load.join('\n');
					} else {
						load[index] = createLoadingBar({ percentage: 100, index });
						captionLoading = 'Loading media. Please wait.\n' + load.join('\n');
					}

					completed++;

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
											conversation: captionLoading
										}
									}
								}
							}
						},
						{}
					);

					await client.instance.relayMessage(from, messages.message, {
						messageId: messages.key.id,
						useCachedGroupMetadata: true
					});

					const buffer = req.toBuffer();
					const mediaType = videoFormat.includes(req.headers['content-type'])
						? 'video'
						: imageFormat.includes(req.headers['content-type'])
						? 'image'
						: audioFormat.includes(req.headers['content-type'])
						? 'audio'
						: 'document';

					await client.instance.send(
						from,
						{
							[mediaType]: new Buffer.from(buffer, 'base64'),
							caption: '*Buffer Type* : ' + mediaType,
							benchmark: true,
							timeOnProcess
						},
						{}
					);
				}
			});

			req.on('progress', async (progress, index = i) => {
				load[index] = createLoadingBar({ ...progress, index });
				captionLoading = 'Loading media. Please wait.\n' + load.join('\n');
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
										conversation: captionLoading
									}
								}
							}
						}
					},
					{}
				);

				await client.instance.relayMessage(from, messages.message, {
					messageId: messages.key.id,
					useCachedGroupMetadata: true
				});
			});

			req.on('cancel', async ({ cancelByUser }) => {
				if (cancelByUser) {
					captionLoading = 'Download canceled by user.\n' + load.join('\n');
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
											conversation: captionLoading
										}
									}
								}
							}
						},
						{}
					);

					await client.instance.relayMessage(from, messages.message, {
						messageId: messages.key.id,
						useCachedGroupMetadata: true
					});
				}
			});
		});
	}
};
