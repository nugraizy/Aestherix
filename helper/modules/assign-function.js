/* global botNum, store */
import {
	downloadContentFromMessage,
	downloadMediaMessage as downloadMessage,
	generateWAMessage,
	generateWAMessageFromContent,
	toBuffer,
} from '@adiwajshing/baileys';

const { AnyMessageContent, AnyMediaMessageContent, ButtonReplyInfo, WAMessageKey, MinimalMessage, WAProto } = (
	await import('@adiwajshing/baileys')
).default;

import axios from 'axios';
import { fileTypeFromBuffer } from 'file-type';
import ffmpeg from 'fluent-ffmpeg';
import webpmux from 'node-webpmux';
import sharp from 'sharp';
import { TextEncoder } from 'util';

import { S_WHATSAPP_NET, UPDATE, ZERO } from '../misc/wa_data/index.js';
import { isURL, delaySync, fetchBUFFER } from './functions.js';
import { reassign } from './reassign-messages-object.js';

const { readFile, unlink, writeFile } = (await import('fs-extra')).default;

/**
 * Assign functions for easiest use.
 * @param {object} client SocketClient.
 * @returns
 */
export const assign = (client) => {
	/**
	 * @typedef {'imageMessage' | 'videoMessage' | 'audioMessage' | 'documentMessage' |'stickerMessage' | 'locationMessage'} MediaType
	 */

	/**
	 * Prepare media message to send to WhatsApp.
	 * @param {(string|ArrayBufferLike)} media files media path, url, or arrayBuffers.
	 * @param {MediaType} type media type for messages.
	 * @param {MessageGenerationOptionsFromContent & {fileName?: string, mimetype?: string}} opts
	 * @returns {Promise<MinimalMessage & {message: AnyMediaMessageContent}>}
	 */
	const prepareMedia = async (media, type, opts = {}) => {
		switch (type) {
			case 'imageMessage': {
				return await generateWAMessage(
					ZERO,
					{ image: isURL(media) ? { url: media } : media },
					{ ...opts, upload: client[botNum].waUploadToServer },
				);
			}
			case 'videoMessage': {
				return await generateWAMessage(
					ZERO,
					{ video: isURL(media) ? { url: media } : media },
					{ ...opts, upload: client[botNum].waUploadToServer },
				);
			}
			case 'audioMessage': {
				return await generateWAMessage(
					ZERO,
					{ audio: isURL(media) ? { url: media } : media },
					{ ...opts, upload: client[botNum].waUploadToServer },
				);
			}
			case 'documentMessage': {
				return await generateWAMessage(
					ZERO,
					{ document: isURL(media) ? { url: media } : media, fileName: opts.fileName, mimetype: opts.mimetype },
					{ ...opts, upload: client[botNum].waUploadToServer },
				);
			}
			case 'stickerMessage': {
				return await generateWAMessage(
					ZERO,
					{ sticker: isURL(media) ? { url: media } : media },
					{ ...opts, upload: client[botNum].waUploadToServer },
				);
			}
			case 'locationMessage': {
				return await generateWAMessage(ZERO, { ...media }, { ...opts, upload: client[botNum].waUploadToServer });
			}
		}
	};
	/**
	 * @typedef {{id?: string, packname?: string, author?: string}} ExifMetadata
	 */
	/**
	 * Apply exif to a media files.
	 * @param {ArrayBufferLike} buffer media buffer to be applied exif metadata.
	 * @param {ExifMetadata} metadata exif metadata info.
	 * @returns {Promise<ArrayBufferLike>}
	 */
	const applyExif = async (buffer, metadata) => {
		const data = {};

		data['sticker-pack-id'] = metadata?.id || '';
		data['sticker-pack-name'] = metadata?.packname || '';
		data['sticker-pack-publisher'] = metadata?.author || '';

		const exif = Buffer.concat([
			Buffer.from([
				0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00,
				0x00, 0x00,
			]),
			Buffer.from(JSON.stringify(data), 'utf-8'),
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

	client[botNum] = {
		...client[botNum],
		applyExif,
		/**
		 * Reply people message.
		 * @param {{from: string, quoted?: AnyMediaMessageContent}} param0
		 * @param {string} text texts to be sent.
		 * @returns {MinimalMessage & {message: {extendedTextMessage: WAProto.Message.ExtendedTextMessage}}}
		 */
		reply: async ({ from, quoted }, text) => {
			return await client[botNum].sendMessage(from, { text }, { quoted });
		},
		/**
		 *
		 * @typedef {'imageMessage' | 'videoMessage' | 'stickerAnimated' | undefined} StickerType
		 */
		/**
		 * Prepare sticker to be sent.
		 * @param {(ArrayBufferLike|string)} media path or arrayBuffers.
		 * @param {string} filename temporary filename to be saved.
		 * @param {StickerType} type media type.
		 * @param {ExifMetadata} options
		 * @returns {Promise<ArrayBufferLike>}
		 */
		prepareSticker: async (media, filename, type, options) => {
			const isMediaURL = Buffer.isBuffer(media) ? false : isURL(media) ? true : false;

			media = isMediaURL
				? (await axios.get(media, { responseType: 'arraybuffer', headers: { DNT: 1, 'Upgrade-Insecure-Request': 1 } })).data
				: media;

			const bufferType =
				type == 'imageMessage'
					? 'image'
					: type == 'videoMessage'
					? 'video'
					: type == 'stickerAnimated'
					? 'sticker'
					: (await fileTypeFromBuffer(media)).mime.includes('video')
					? 'video'
					: 'image';

			if (bufferType == 'video') {
				const [video, webp] = ['video', 'webp'].map((ext) => `${filename}.${ext}`);

				await writeFile(video, media);

				await new Promise((resolve) => {
					ffmpeg(video)
						.videoCodec('libwebp')
						.outputFPS(30)
						.videoFilter(
							'scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,setsar=1',
						)
						.duration(10)
						.save(webp)
						.on('end', resolve);
				});

				media = await readFile(webp);

				[video, webp].forEach((file) => unlink(file));
			} else if (bufferType == 'sticker') {
				return await applyExif(media, options);
			} else {
				media = await sharp(media, { animated: bufferType == 'video' })
					.resize(512, 512, {
						fit: sharp.fit.contain,
						background: { r: 0, g: 0, b: 0, alpha: 0 },
					})
					.webp()
					.toBuffer();
			}

			return await applyExif(media, options);
		},
		/**
		 * Download and save WhatsApp media message to local.
		 * @param {AnyMediaMessageContent} media media message content.
		 * @param {string} path filepath to be saved.
		 * @param {string} typeQuoted
		 * @returns {Promis<string>}
		 */
		downloadAndSaveMediaMessage: (media, path, typeQuoted) =>
			new Promise(async (resolve) => {
				const msg = await downloadContentFromMessage(media, typeQuoted.replace(/Message/g, ''));
				const buffer = await toBuffer(msg);

				await writeFile(path, buffer);

				resolve(path);
			}),
		/**
		 * Download WhatsApp media message to buffer.
		 * @param {AnyMediaMessageContent} media media message content.
		 * @param {'stream' | 'buffer'} typeDownloadable
		 * @returns {Promise<ArrayBufferLike>}
		 */
		downloadMediaMessage: async (media, typeDownloadable = 'buffer') => {
			return await downloadMessage(media, typeDownloadable);
		},
		/**
		 *
		 * @param {string} to destination the message to be sent.
		 * @param {string} contentText header of content.
		 * @param {string} footerText footer of content.
		 * @param {ButtonReplyInfo[]} buttons
		 * @param {} opts
		 * @returns
		 */
		buttonText: async (to, contentText, footerText, buttons, opts = {}) => {
			if (buttons.length == 0) {
				return new Error('Buttons is empty');
			}

			return await client[botNum].sendMessage(to, {
				text: contentText,
				footer: footerText,
				buttons,
				headerType: 1,
				contextInfo: opts.contextInfo,
			});
		},
		prepareMedia,
		buttonDocument: async (dari, contentText, footerText, buttons, media, opts = {}) => {
			if (buttons.length == 0) {
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
						documentMessage: document.message.documentMessage,
					},
				},
				opts,
			);

			await client[botNum].relayMessage(dari, message.message, { messageId: message.key.id });

			return message;
		},
		buttonLocation: async (dari, contentText, footerText, buttons, media, opts = {}) => {
			if (buttons.length == 0) {
				return new Error('Buttons is empty');
			}

			const location = await generateWAMessage(
				ZERO,
				{ location: { degreesLatitude: 0, degreesLongitude: 0, jpegThumbnail: media, name: 'provided by nanda' } },
				opts,
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
						locationMessage: location.message.locationMessage,
					},
				},
				opts,
			);

			await client[botNum].relayMessage(dari, message.message, { messageId: message.key.id });

			return message;
		},
		setStatus: async (status) => {
			if (!status) {
				return new Error('Status is empty');
			}

			return await client[botNum].query({
				tag: 'iq',
				attrs: {
					to: S_WHATSAPP_NET,
					type: 'set',
					xmlns: 'status',
				},
				content: [
					{
						tag: 'status',
						attrs: {},
						content: Buffer.from(status, 'utf-8'),
					},
				],
			});
		},
		updateGroup: async (dari, containers, update, texts, force, message, adminGroups) => {
			const responses = [];

			if (update.PARSE_EVENTS('ADD', 'REMOVE', 'DEMOTE', 'PROMOTE')) {
				for (const container of containers) {
					try {
						if (!force && adminGroups.includes(container) && update == 'REMOVE') {
							await client[botNum].sendMessage(
								dari,
								{
									text: `You can't ${update} @${
										container.split('@')[0]
									} because it's admin group.\nadd --force flag to force update admin`,
									mentions: [container],
								},
								{ quoted: message },
							);

							continue;
						}

						if (adminGroups.includes(container) && update == 'PROMOTE') {
							await client[botNum].sendMessage(
								dari,
								{
									text: `You can't ${update} @${container.split('@')[0]} because they already an admin group.`,
									mentions: [container],
								},
								{ quoted: message },
							);

							continue;
						}

						if (!adminGroups.includes(container) && update == 'DEMOTE') {
							await client[botNum].sendMessage(
								dari,
								{
									text: `You can't ${update} @${container.split('@')[0]} because they already a member group.`,
									mentions: [container],
								},
								{ quoted: message },
							);

							continue;
						}

						const response = await client[botNum][UPDATE[update]](dari, [container], update.toLowerCase());

						if (update.PARSE_EVENTS('ADD')) {
							if (response?.[0]?.status == '500') {
								await client[botNum].reply({ from: dari, quoted: message }, 'Group is already full');
							} else if (response?.[0]?.status == '408') {
								await client[botNum].reply({ from: dari, quoted: message }, `${container} is just left a while ago`);
							} else if (response?.[0]?.status == '403') {
								await client[botNum].reply(
									{ from: dari, quoted: message },
									`${container} is privated their number. Trying to invite them via invitational message.`,
								);

								const messages = generateWAMessageFromContent(
									dari,
									{
										groupInviteMessage: {
											groupJid: dari,
											inviteCode: response?.[0].code,
											inviteExpiration: response?.[0].expiration,
											groupName: (await client[botNum].groupMetadata(dari)).subject,
											caption: 'Invitation to join my WhatsApp group',
											jpegThumbnail: new Buffer.from(
												await fetchBUFFER(await client[botNum].profilePictureUrl(dari, 'preview')),
											).toString('base64'),
										},
									},
									{},
								);

								await client[botNum].relayMessage(container, messages.message, { messageId: messages.key.id });
							} else if (response?.[0]?.status == '401') {
								await client[botNum].reply({ from: dari, quoted: message }, `${container} blocked bot number`);
							}
						}

						delaySync(120);
						responses.push(response);
					} catch (e) {
						responses.push({ error: e.message, id: container });

						if (e?.[0]?.status == '400') {
							await client[botNum].reply({ from: dari, quoted: message }, `${container} is not a valid number`);
						}

						return;
					}
				}
			}

			if (update.PARSE_EVENTS('SUBJECT', 'DESCRIPTION')) {
				const response = await client[botNum][UPDATE[update]](dari, texts);

				responses.push(response);
			}

			if (update.PARSE_EVENTS('ANNOUNCEMENT', 'NOT_ANNOUNCEMENT', 'UNLOCKED', 'LOCKED')) {
				const response = await client[botNum][UPDATE[update]](dari, update.toLowerCase());

				responses.push(response);
			}

			if (update.PARSE_EVENTS('RETRIEVE', 'REVOKE')) {
				const response = await client[botNum][UPDATE[update]](dari);

				responses.push(response);
			}

			return responses;
		},
		searchMessage: async (dari, query) => {
			let i = 0;
			const containers = await store.loadMessages(dari);
			const keys = [];

			if (containers.length == 0) {
				return keys;
			}

			for (const messages of containers) {
				if (i == 20) {
					break;
				}

				const { message, body, isCmd } = await reassign(JSON.parse(JSON.stringify(messages)), client, store);

				if (body.includes(query) && !isCmd) {
					keys.push(message);
					i++;
				}
			}

			return keys;
		},
	};
};
