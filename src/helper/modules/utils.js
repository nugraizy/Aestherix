import {
	downloadContentFromMessage,
	downloadMediaMessage as downloadMessage,
	generateWAMessage,
	generateWAMessageFromContent,
	toBuffer
} from '@adiwajshing/baileys';
import axios from 'axios';
import { fileTypeFromBuffer } from 'file-type';
import ffmpeg from 'fluent-ffmpeg';
import webpmux from 'node-webpmux';
import sharp from 'sharp';
import { TextEncoder } from 'util';

import configuration from '../config/connect.js';
import { S_WHATSAPP_NET, UPDATE, ZERO } from '../misc/wa_data/index.js';
import { isURL, fetchBUFFER } from '../../utils/modules/index.js';
import { reassign } from './parse-message.js';

const { readFile, unlink, writeFile } = (await import('fs-extra')).default;

/**
 * @typedef {'imageMessage' | 'videoMessage' | 'audioMessage' | 'documentMessage' |'stickerMessage' | 'locationMessage'} MediaType
 * @typedef {import('@adiwajshing/baileys').proto.WebMessageInfo} MessageGenerated
 * @typedef {import('@adiwajshing/baileys').proto.IWebMessageInfo} MessageGeneratedII
 * @typedef {import('@adiwajshing/baileys').ButtonReplyInfo} ButtonReplyInfo
 * @typedef {'imageMessage' | 'videoMessage' | 'stickerAnimated' | undefined} StickerType
 * @typedef {{id?: string, packname?: string, author?: string}} ExifMetadata
 * @typedef {(media: (string|Buffer), type: MediaType, opts?: import('@adiwajshing/baileys').MessageGenerationOptions) => Promise<MessageGenerated>} PrepareMedia
 * @typedef {(buffer: (string|Buffer), metadata: ExifMetadata) => Promise<Buffer>} AppliedExif
 * @typedef {(to: string, message: import('@adiwajshing/baileys').AnyMessageContent, options: import('@adiwajshing/baileys').MiscMessageGenerationOptions & import('@adiwajshing/baileys').GroupMetadata) => Promise<MessageGenerated>} SendMessage
 * @typedef {(_: { from: string, quoted?: import('@adiwajshing/baileys').MessageGenerationOptionsFromContent['quoted'], groupMetadata?: import('@adiwajshing/baileys').GroupMetadata }, text: string) => Promise<MessageGenerated>} ReplyMessage
 * @typedef {(media: Buffer | string, filename: string, type: StickerType, options: ExifMetadata) => Promise<Buffer>} PrepareSticker
 * @typedef {(media: import('@adiwajshing/baileys').DownloadableMessage, path: string, typeQuoted: keyof import('@adiwajshing/baileys').proto.IMessage) => Promise<string>} DownloadAndSave
 * @typedef {(media: MessageGeneratedII, typeDownloadable: 'stream' | 'buffer') => Promise<Buffer | import("stream").Transform>} DownloadMedia
 * @typedef {(to: string, contentText: string, footerText: string, buttons: ButtonReplyInfo[], opts?: import('@adiwajshing/baileys').MiscMessageGenerationOptions) => Promise<MessageGenerated>} SendButtonText
 * @typedef {(to: string, contentText: string, footerText: string, buttons: ButtonReplyInfo[], media: string | Buffer, opts?: import('@adiwajshing/baileys').MiscMessageGenerationOptions) => Promise<MessageGenerated>} SendButtonDocument
 * @typedef {(to: string, contentText: string, footerText: string, buttons: ButtonReplyInfo[], media: string | Buffer, opts?: import('@adiwajshing/baileys').MiscMessageGenerationOptions) => Promise<MessageGenerated>} SendButtonLocation
 * @typedef {(status: string) => Promise<import('@adiwajshing/baileys').BinaryNode>} SetInfo
 * @typedef {(to: string, containers: string[], update: keyof UPDATE, texts: string, force: boolean, message: import('@adiwajshing/baileys').MiscMessageGenerationOptions['quoted'],  adminGroups: string[]) => Promise<unknown>} UpdateGroup
 * @typedef {(to: string, query: string) => Promise<unknown>} SearchMessage
 */

/**
 * @typedef {{prepareMedia: PrepareMedia, applyExif: AppliedExif, send: SendMessage, reply: ReplyMessage, prepareSticker: PrepareSticker, downloadAndSaveMediaMessage: DownloadAndSave, downloadMediaMessage: DownloadMedia, buttonText: SendButtonText, buttonDocument: SendButtonDocument, buttonLocation: SendButtonLocation, setStatus: SetInfo, updateGroup: UpdateGroup, searchMessage: SearchMessage}} AdvancedClient
 */

/**
 * Assign functions for easiest use.
 * @param {import('../connection/event-handler/universal.js').ClientSocket} client SocketClient.
 * @returns {AdvancedClient}
 */
export const assign = (client) => {
	/**
	 * Prepare Message Before Snding
	 * @type {PrepareMedia}
	 */
	const prepareMedia = async (media, type, opts = {}) => {
		switch (type) {
			case 'imageMessage': {
				return await generateWAMessage(
					ZERO,
					{ image: isURL(media) ? { url: media } : media },
					{ ...opts, upload: client[botNum].waUploadToServer }
				);
			}
			case 'videoMessage': {
				return await generateWAMessage(
					ZERO,
					{ video: isURL(media) ? { url: media } : media },
					{ ...opts, upload: client[botNum].waUploadToServer }
				);
			}
			case 'audioMessage': {
				return await generateWAMessage(
					ZERO,
					{ audio: isURL(media) ? { url: media } : media },
					{ ...opts, upload: client[botNum].waUploadToServer }
				);
			}
			case 'documentMessage': {
				return await generateWAMessage(
					ZERO,
					{ document: isURL(media) ? { url: media } : media, fileName: opts.fileName, mimetype: opts.mimetype },
					{ ...opts, upload: client[botNum].waUploadToServer }
				);
			}
			case 'stickerMessage': {
				return await generateWAMessage(
					ZERO,
					{ sticker: isURL(media) ? { url: media } : media },
					{ ...opts, upload: client[botNum].waUploadToServer }
				);
			}
			case 'locationMessage': {
				return await generateWAMessage(ZERO, { ...media }, { ...opts, upload: client[botNum].waUploadToServer });
			}
		}
	};

	/**
	 * Apply exif to a media files.
	 * @type {AppliedExif}
	 */
	const applyExif = async (buffer, metadata) => {
		const data = {};

		data['sticker-pack-id'] = metadata?.id || '';
		data['sticker-pack-name'] = metadata?.packname || '';
		data['sticker-pack-publisher'] = metadata?.author || '';

		const exif = Buffer.concat([
			Buffer.from([
				0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00,
				0x00, 0x00
			]),
			Buffer.from(JSON.stringify(data), 'utf-8')
		]);

		exif.writeUIntLE(new TextEncoder().encode(JSON.stringify(data)).length, 14, 4);

		buffer =
			buffer instanceof webpmux.Image
				? buffer
				: await (async () => {
						const img = new webpmux.Image();

						await img.load(buffer);
						return img;
				  })(); /* eslint-disable-line */
		buffer.exif = exif;

		return await buffer.save(null);
	};

	/**
	 * Send any message.
	 * @type {SendMessage}
	 */
	const send = async (to, message, options) => {
		options = {
			...options,
			...(options?.groupMetadata ? { cachedGroupMetadata: () => options?.groupMetadata } : {}),
			ephemeralExpiration:
				options?.groupMetadata?.ephemeralDuration ||
				configuration.cache.metadata?.get(to)?.ephemeralDuration ||
				configuration.cache.users?.get(to)?.ephemeralDuration ||
				null
		};

		if ('buttons' in message || 'sections' in message || 'templateButtons' in message) {
			delete message.buttons;
			delete message.footer;
			delete message.headerType;
			delete message.templateButtons;
		}

		if (('image' in message && 'footer' in message) || ('video' in message && 'footer' in message)) {
			if (message.caption) {
				message.caption = `${message?.caption}\n\n${message.footer}`?.trim();
			}
		}

		// filter: if ('templateButtons' in message) {
		// 	const filteredButtons = message.templateButtons.filter((v) => v.quickReplyButton);

		// 	if (filteredButtons.length === 0) {
		// 		delete message.templateButtons;
		// 		delete message.footer;

		// 		break filter;
		// 	}

		// 	message.buttons = filteredButtons.map((v) => ({
		// 		buttonId: v.quickReplyButton.id,
		// 		buttonText: { displayText: v.quickReplyButton.displayText },
		// 		type: 1
		// 	}));

		// 	if ('text' in message) {
		// 		message.headerType = proto.Message.ButtonsMessage.HeaderType.TEXT;
		// 	} else if ('image' in message) {
		// 		message.headerType = proto.Message.ButtonsMessage.HeaderType.IMAGE;
		// 	} else if ('video' in message) {
		// 		message.headerType = proto.Message.ButtonsMessage.HeaderType.VIDEO;
		// 	} else if ('document' in message) {
		// 		message.headerType = proto.Message.ButtonsMessage.HeaderType.DOCUMENT;
		// 	} else if ('location' in message) {
		// 		message.headerType = proto.Message.ButtonsMessage.HeaderType.LOCATION;
		// 	}

		// 	delete message.templateButtons;
		// 	delete options.ephemeralExpiration;
		// }

		return client[botNum].sendMessage(to, message, options);
	};

	client[botNum] = {
		...client[botNum],
		send,
		applyExif,

		/**
		 * Send and reply any user message.
		 * @type {ReplyMessage}
		 */
		reply: async ({ from, quoted, groupMetadata }, text) =>
			await send(
				from,
				{ text },
				{
					quoted,
					cachedGroupMetadata: () => groupMetadata,
					ephemeralExpiration:
						groupMetadata?.ephemeralDuration || configuration.cache.users?.get(from)?.ephemeralDuration || null
				}
			),

		/**
		 * Prepare media before sending it as readable WhatsApp sticker.
		 * @type {PrepareSticker}
		 */
		prepareSticker: async (media, filename, type, options) => {
			const isMediaURL = Buffer.isBuffer(media) ? false : isURL(media) ? true : false;

			media = isMediaURL
				? (
						await axios.get(media, {
							responseType: 'arraybuffer',
							headers: { DNT: 1, 'Upgrade-Insecure-Request': 1 },
							validateStatus: () => true
						})
				  ).data /* eslint-disable-line */
				: media;

			const bufferType =
				type === 'imageMessage'
					? 'image'
					: type === 'videoMessage'
					? 'video'
					: type === 'stickerAnimated'
					? 'sticker'
					: (await fileTypeFromBuffer(media)).mime.includes('video')
					? 'video'
					: 'image';

			if (bufferType === 'video') {
				const [video, webp] = ['video', 'webp'].map((ext) => `${filename}.${ext}`);

				await writeFile(video, media);

				await new Promise((resolve) => {
					ffmpeg(video)
						.videoCodec('libwebp')
						.outputOptions('-fs 800k')
						.outputFPS(30)
						.videoFilter(
							'scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,setsar=1'
						)
						.duration(10)
						.save(webp)
						.on('end', resolve);
				});

				media = await readFile(webp);

				[video, webp].forEach((file) => unlink(file));
			} else if (bufferType === 'sticker') {
				return await applyExif(media, options);
			} else {
				media = await sharp(media, { animated: bufferType === 'video' })
					.resize(512, 512, {
						fit: sharp.fit.contain,
						background: { r: 0, g: 0, b: 0, alpha: 0 }
					})
					.webp()
					.toBuffer();
			}

			return await applyExif(media, options);
		},

		/**
		 * Download WhatsApp media and save it to local drive.
		 * @type {DownloadAndSave}
		 */
		downloadAndSaveMediaMessage: (media, path, typeQuoted) =>
			new Promise(async (resolve) => {
				const msg = await downloadContentFromMessage(media, typeQuoted.replace(/Message/g, ''));
				const buffer = await toBuffer(msg);

				await writeFile(path, buffer);

				resolve(path);
			}),

		/**
		 * Download WhatsApp media and returns it as buffer | stream.
		 * @type {DownloadMedia}
		 */
		downloadMediaMessage: async (media, typeDownloadable = 'buffer') => {
			return await downloadMessage(media, typeDownloadable);
		},

		/**
		 * Send button text.
		 * @type {SendButtonText}
		 */
		buttonText: async (to, contentText, footerText, buttons, opts = {}) => {
			if (buttons.length === 0) {
				return new Error('Buttons is empty');
			}

			return await send(
				to,
				{
					text: contentText,
					footer: footerText,
					buttons,
					headerType: 1,
					contextInfo: opts.contextInfo
				},
				opts
			);
		},

		prepareMedia,

		/**
		 * Send button document.
		 * @type {SendButtonDocument}
		 */
		buttonDocument: async (to, contentText, footerText, buttons, media, opts = {}) => {
			if (buttons.length === 0) {
				return new Error('Buttons is empty');
			}

			const document = await prepareMedia(media, 'documentMessage', opts);

			const message = generateWAMessageFromContent(
				ZERO,
				{
					buttonsMessage: {
						buttons,
						contentText,
						footerText,
						headerType: 3,
						contextInfo: opts.contextInfo,
						documentMessage: document.message.documentMessage
					}
				},
				opts
			);

			await client[botNum].relayMessage(to, message.message, { messageId: message.key.id });

			return message;
		},

		/**
		 * Send button location.
		 * @type {SendButtonLocation}
		 */
		buttonLocation: async (dari, contentText, footerText, buttons, media, opts = {}) => {
			if (buttons.length === 0) {
				return new Error('Buttons is empty');
			}

			const location = await generateWAMessage(
				ZERO,
				{ location: { degreesLatitude: 0, degreesLongitude: 0, jpegThumbnail: media, name: 'provided by nanda' } },
				opts
			);

			const message = generateWAMessageFromContent(
				ZERO,
				{
					buttonsMessage: {
						buttons,
						contentText,
						footerText,
						headerType: 6,
						contextInfo: opts.contextInfo,
						locationMessage: location.message.locationMessage
					}
				},
				opts
			);

			await client[botNum].relayMessage(dari, message.message, { messageId: message.key.id });

			return message;
		},

		/**
		 * Set profile info of the bot.
		 * @type {SetInfo}
		 */
		setStatus: async (status) => {
			if (!status) {
				return new Error('Status is empty');
			}

			return await client[botNum].query({
				tag: 'iq',
				attrs: {
					to: S_WHATSAPP_NET,
					type: 'set',
					xmlns: 'status'
				},
				content: [
					{
						tag: 'status',
						attrs: {},
						content: Buffer.from(status, 'utf-8')
					}
				]
			});
		},

		/**
		 * Update group's participants or settings.
		 * @type {UpdateGroup}
		 */
		updateGroup: async (to, containers, update, texts, force, message, adminGroups) => {
			const responses = [];

			if (update.PARSE_EVENTS('ADD', 'REMOVE', 'DEMOTE', 'PROMOTE')) {
				for (const container of containers) {
					try {
						if (!force && adminGroups.includes(container) && update === 'REMOVE') {
							await send(
								to,
								{
									text: `You can't ${update} @${
										container.split('@')[0]
									} because it's admin group.\nadd --force flag to force update admin`,
									mentions: [container]
								},
								{ quoted: message }
							);

							continue;
						}

						if (adminGroups.includes(container) && update === 'PROMOTE') {
							await send(
								to,
								{
									text: `You can't ${update} @${container.split('@')[0]} because they already an admin group.`,
									mentions: [container]
								},
								{ quoted: message }
							);

							continue;
						}

						if (!adminGroups.includes(container) && update === 'DEMOTE') {
							await send(
								to,
								{
									text: `You can't ${update} @${container.split('@')[0]} because they already a member group.`,
									mentions: [container]
								},
								{ quoted: message }
							);

							continue;
						}

						const response = await client[botNum][UPDATE[update]](to, [container], update.toLowerCase());

						if (update.PARSE_EVENTS('ADD')) {
							if (response?.[0]?.status === '500') {
								await send(to, { text: 'Group is already full' }, { quoted: message });
							} else if (response?.[0]?.status === '408') {
								await send(to, { text: `${container} is just left a while ago` }, { quoted: message });
							} else if (response?.[0]?.status === '403') {
								await send(
									to,
									{ text: `${container} is privated their number. Trying to invite them via invitational message.` },
									{ quoted: message }
								);

								const messages = generateWAMessageFromContent(
									to,
									{
										groupInviteMessage: {
											groupJid: to,
											inviteCode: response?.[0]?.code,
											inviteExpiration: response?.[0]?.expiration,
											groupName: (await client[botNum].groupMetadata(to)).subject,
											caption: 'Invitation to join my WhatsApp group',
											jpegThumbnail: new Buffer.from(
												await fetchBUFFER(await client[botNum].profilePictureUrl(to, 'preview'))
											).toString('base64')
										}
									},
									{}
								);

								await client[botNum].relayMessage(container, messages.message, { messageId: messages.key.id });
							} else if (response?.[0]?.status === '401') {
								await send(to, { text: `${container} blocked bot number` }, { quoted: message });
							}
						}

						responses.push(response);
					} catch (e) {
						responses.push({ error: e.message, id: container });

						if (e?.[0]?.status === '400') {
							await send(to, { text: `${container} is not a valid number` }, { quoted: message });
						}

						return;
					}
				}
			}

			if (update.PARSE_EVENTS('SUBJECT', 'DESCRIPTION')) {
				const response = await client[botNum][UPDATE[update]](to, texts);

				responses.push(response);
			}

			if (update.PARSE_EVENTS('ANNOUNCEMENT', 'NOT_ANNOUNCEMENT', 'UNLOCKED', 'LOCKED')) {
				const response = await client[botNum][UPDATE[update]](to, update.toLowerCase());

				responses.push(response);
			}

			if (update.PARSE_EVENTS('RETRIEVE', 'REVOKE')) {
				const response = await client[botNum][UPDATE[update]](to);

				responses.push(response);
			}

			return responses;
		},

		/**
		 * Search a message from the destination.
		 * @type {SearchMessage}
		 */
		searchMessage: async (to, query) => {
			let i = 0;
			const containers = await store.loadMessages(to);
			const keys = [];

			if (containers.length === 0) {
				return keys;
			}

			for (const messages of containers) {
				if (i === 20) {
					break;
				}

				const { message, body, isCmd } = await reassign(JSON.parse(JSON.stringify(messages)), client, store);

				if (body.includes(query) && !isCmd) {
					keys.push(message);
					i++;
				}
			}

			return keys;
		}
	};
};
