import {
	downloadContentFromMessage,
	downloadMediaMessage as downloadMessage,
	generateWAMessage,
	generateWAMessageFromContent,
	isJidGroup,
	jidDecode,
	jidNormalizedUser,
	toBuffer
} from 'baileys';
import { fileTypeFromBuffer } from 'file-type';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs-extra';
import isBuffer from 'is-buffer';
import webpmux from 'node-webpmux';
import { randomBytes } from 'node:crypto';
import { Readable } from 'node:stream';
import sharp from 'sharp';
import { fetch } from 'undici';
import { TextEncoder } from 'util';

import { gif2mp4 } from '../../utils/index.js';
import { fetchBUFFER, isURL } from '../../utils/modules/index.js';
import configuration from '../config/connect.js';
import { getAllContacts } from '../database/adapters/user.js';
import prisma from '../database/prisma.js';
import { S_WHATSAPP_NET, UPDATE, ZERO } from '../misc/wa_data/index.js';
import { reassign } from './parse-message.js';

const { readFile, unlink, writeFile } = (await import('fs-extra')).default;

/**
 * Generate message ID before sending.
 * @type {import('../../types/Utils/index.js').GenerateMessageID}
 */
const generateMessageID = () => 'HFINDER' + randomBytes(18).toString('hex').toUpperCase();

/**
 * Assign functions for easier use.
 * @type {import('../../types/Utils/index.js').AssignSocketClient}
 */
export const assign = (client) => {
	/**
	 * Prepare Message Before Sending
	 * @type {import('../../types/Utils/index.js').PrepareMedia}
	 */
	const prepareMedia = async (media, type, opts = {}) => {
		switch (type) {
			case 'imageMessage': {
				return await generateWAMessage(
					ZERO,
					{ image: isURL(media) ? { url: media } : media },
					{ ...opts, upload: client.instance.waUploadToServer }
				);
			}
			case 'videoMessage': {
				return await generateWAMessage(
					ZERO,
					{ video: isURL(media) ? { url: media } : media },
					{ ...opts, upload: client.instance.waUploadToServer }
				);
			}
			case 'audioMessage': {
				return await generateWAMessage(
					ZERO,
					{ audio: isURL(media) ? { url: media } : media },
					{ ...opts, upload: client.instance.waUploadToServer }
				);
			}
			case 'documentMessage': {
				return await generateWAMessage(
					ZERO,
					{ document: isURL(media) ? { url: media } : media, fileName: opts.fileName, mimetype: opts.mimetype },
					{ ...opts, upload: client.instance.waUploadToServer }
				);
			}
			case 'stickerMessage': {
				return await generateWAMessage(
					ZERO,
					{ sticker: isURL(media) ? { url: media } : media },
					{ ...opts, upload: client.instance.waUploadToServer }
				);
			}
			case 'locationMessage': {
				return await generateWAMessage(ZERO, { ...media }, { ...opts, upload: client.instance.waUploadToServer });
			}
		}
	};

	/**
	 * Apply exif to a media files.
	 * @type {import('../../types/Utils/index.js').AppliedExif}
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
					})();
		buffer.exif = exif;

		return await buffer.save(null);
	};

	/**
	 * Send any message.
	 * @type {import('../../types/Utils/index.js').SendMessage}
	 */
	const send = async (jid, message, options) => {
		options = {
			...options,
			...(isJidGroup(jid) && { useCachedGroupMetadata: true }),
			ephemeralExpiration:
				options?.groupMetadata?.ephemeralDuration ||
				configuration.cache.metadata?.get(jid)?.ephemeralDuration ||
				configuration.cache.users?.get(jid)?.ephemeralDuration ||
				0,
			messageId: generateMessageID(),
			ai: true
		};

		if (('image' in message || 'video' in message) && 'footer' in message) {
			if (message.caption) {
				message.caption = `${message?.caption}\n\n${message.footer}`?.trim();
			}
		}

		if ((message?.video || message?.image || message?.document || message?.audio)?.url) {
			const buffer = await fetchBUFFER((message.video || message.image || message.document || message.audio)?.url);

			if (message.video) {
				message.video = buffer;
			}

			if (message.image) {
				message.image = buffer;
			}

			if (message.document) {
				message.document = buffer;
			}

			if (message.audio) {
				message.audio = buffer;
			}
		}

		return client.instance.sendMessage(jid, message, options);
	};

	/**
	 * Relay any message.
	 * @type {import('../../types/Utils/index.js').SendMessage}
	 */
	const relay = async (jid, message, options) => {
		options = {
			...options,
			...(isJidGroup(jid) && { useCachedGroupMetadata: true }),
			ephemeralExpiration:
				options?.groupMetadata?.ephemeralDuration ||
				configuration.cache.metadata?.get(jid)?.ephemeralDuration ||
				configuration.cache.users?.get(jid)?.ephemeralDuration ||
				0,
			messageId: generateMessageID(),
			AI: true
		};

		return client.instance.relayMessage(jid, message, options);
	};

	const getStoryParticipantsNode = (client) =>
		client.instance.query({
			tag: 'iq',
			attrs: {
				id: generateMessageID(),
				to: '@s.whatsapp.net',
				xmlns: 'status',
				type: 'get'
			},
			content: [
				{
					tag: 'privacy',
					attrs: {},
					content: undefined
				}
			]
		});

	class InteractiveButtons {
		button = {
			copy(data) {
				return {
					name: 'cta_copy',
					buttonParamsJson: JSON.stringify({
						display_text: data.display,
						copy_code: data.code
					})
				};
			},

			reply(data) {
				return {
					name: 'quick_reply',
					buttonParamsJson: JSON.stringify({
						display_text: data.display,
						id: data.id
					})
				};
			},

			url(data) {
				return {
					name: 'cta_url',
					buttonParamsJson: JSON.stringify({
						display_text: data.display,
						url: data.url,
						merchant_url: data.url
					})
				};
			},

			list(data) {
				return {
					name: 'single_select',
					buttonParamsJson: JSON.stringify({
						title: data.display,
						sections: data.sections
					})
				};
			},

			call(data) {
				return {
					name: 'cta_call',
					buttonParamsJson: JSON.stringify({
						display_text: data.display,
						phone_number: data.phoneNumber
					})
				};
			},

			setReminder(data) {
				return {
					name: 'cta_reminder',
					buttonParamsJson: JSON.stringify({
						display_text: data.display
					})
				};
			},

			cancelReminder(data) {
				return {
					name: 'cta_cancel_reminder',
					buttonParamsJson: JSON.stringify({
						display_text: data.display
					})
				};
			},

			address(data) {
				return {
					name: 'address_message',
					buttonParamsJson: JSON.stringify({
						display_text: data.display
					})
				};
			},

			location(data) {
				return {
					name: 'send_location',
					buttonParamsJson: JSON.stringify({
						display_text: data.display
					})
				};
			},

			webview(data) {
				return {
					name: 'open_webview',
					buttonParamsJson: JSON.stringify({
						title: data.title,
						link: {
							in_app_webview: data.inApp,
							url: data.url
						}
					})
				};
			}
		};
	}

	class Carousel extends InteractiveButtons {
		constructor() {
			super();

			/**
			 * @private
			 */
			this._destination = null;

			/**
			 * @private
			 */
			this._media = null;

			/**
			 * @private
			 */
			this._cards = [];

			/**
			 * @private
			 */
			this._buildParams = {
				message: {
					messageContextInfo: {
						deviceListMetadata: {},
						deviceListMetadataVersion: 2
					},
					interactiveMessage: {
						body: {
							text: ''
						},
						footer: {
							text: ''
						},
						header: {
							title: ''
						},

						carouselMessage: {
							cards: []
						}
					}
				}
			};
		}

		destination(to) {
			this._destination = to;

			return this;
		}

		async render() {
			this._media = !this._media ? { hasMediaAttachment: false } : await this.prepareMessage(this._media);

			this._buildParams.message.interactiveMessage.header = {
				...this._buildParams.message.interactiveMessage.header,
				...this._media
			};
			this._buildParams.message.interactiveMessage.nativeFlowMessage.buttons = this._buttons;

			const message = generateWAMessageFromContent(
				'0@s.whatsapp.net',
				{
					viewOnceMessage: this._buildParams
				},
				{ messageId: generateMessageID() }
			);

			return message;
		}

		async send() {
			this._cards = await Promise.all(this._cards);
			this._media = !this._media ? { hasMediaAttachment: false } : await this.prepareMessage(this._media);

			this._buildParams.message.interactiveMessage.carouselMessage.cards = this._cards;
			this._buildParams.message.interactiveMessage.header = {
				...this._buildParams.message.interactiveMessage.header,
				...this._media
			};

			const {
				key: { id },
				message
			} = generateWAMessageFromContent(
				'0@s.whatsapp.net',
				{
					viewOnceMessage: this._buildParams
				},
				{ messageId: generateMessageID() }
			);

			await relay(this._destination, message, { messageId: id });
		}

		body(text) {
			this._buildParams.message.interactiveMessage.body.text = text;

			return this;
		}

		footer(text) {
			this._buildParams.message.interactiveMessage.footer.text = text;

			return this;
		}

		header(text, media) {
			this._buildParams.message.interactiveMessage.header.title = text;
			this._media = media;

			return this;
		}

		async getMessageType(media) {
			const mime = (await fileTypeFromBuffer(media))?.mime || '';
			const messageType = mime.includes('gif') || mime.includes('video') ? 'videoMessage' : 'imageMessage';

			return { mime, messageType };
		}

		async prepareGif(media, messageType) {
			const id = Date.now();
			const filepath = (u) => `./src/media/temporary_files/${u}`;

			const inputPath = filepath(`input-${id}.gif`);
			const outputPath = filepath(`output-${id}.mp4`);

			await fs.writeFile(inputPath, media);

			const { output } = await gif2mp4(inputPath, outputPath);

			const fileBuffer = await fs.readFile(output);

			const preparedMedia = await prepareMedia(fileBuffer, messageType);

			preparedMedia.message[messageType].gifPlayback = true;

			await unlink(inputPath);
			await unlink(outputPath);

			return preparedMedia;
		}

		async prepareMessage(media) {
			if (isBuffer(media)) {
				const { mime, messageType } = await this.getMessageType(media);
				let preparedMedia = null;

				if (mime === 'image/gif') {
					preparedMedia = await this.prepareGif(media, messageType);
				} else {
					preparedMedia = await prepareMedia(media, messageType);
				}

				return {
					[messageType]: preparedMedia.message[messageType],
					hasMediaAttachment: true
				};
			} else if (typeof media === 'string') {
				if (isURL(media)) {
					const response = await fetch(media);
					const buffer = Buffer.from(await response.arrayBuffer(), 'base64');

					const { mime, messageType } = await this.getMessageType(buffer);
					let preparedMedia = null;

					if (mime === 'image/gif') {
						preparedMedia = await this.prepareGif(buffer, messageType);
					} else {
						preparedMedia = await prepareMedia(buffer, messageType);
					}

					return {
						[messageType]: preparedMedia.message[messageType],
						hasMediaAttachment: true
					};
				} else {
					const messageType = 'imageMessage';

					return {
						[messageType]: (await prepareMedia(Buffer.alloc(10), messageType)).message[messageType],
						hasMediaAttachment: true
					};
				}
			} else {
				const messageType = 'imageMessage';

				return {
					[messageType]: (await prepareMedia(Buffer.alloc(10), messageType)).message[messageType],
					hasMediaAttachment: true
				};
			}
		}

		cards(cards) {
			cards = cards.map(async ({ body, footer, title, header, buttons }) => {
				const attachment = await this.prepareMessage(header || Buffer.alloc(10));

				return {
					body: {
						text: body || ''
					},
					footer: {
						text: footer || ''
					},
					header: {
						title: title || '',
						...attachment
					},
					nativeFlowMessage: {
						buttons,
						messageParamsJson: ''
					}
				};
			});

			this._cards = cards;

			return this;
		}
	}

	class Native extends InteractiveButtons {
		constructor() {
			super();

			/**
			 * @private
			 */
			this._destination = null;

			/**
			 * @private
			 */
			this._media = null;

			/**
			 * @private
			 */
			this._buttons = [];

			/**
			 * @private
			 */
			this._buildParams = {
				message: {
					messageContextInfo: {
						deviceListMetadata: {},
						deviceListMetadataVersion: 2
					},
					interactiveMessage: {
						body: {
							text: ''
						},
						footer: {
							text: ''
						},
						header: {
							title: ''
						},
						nativeFlowMessage: {
							buttons: [],
							messageParamsJson: ''
						}
					}
				}
			};
		}

		destination(to) {
			this._destination = to;

			return this;
		}

		body(text) {
			this._buildParams.message.interactiveMessage.body.text = text;

			return this;
		}

		footer(text) {
			this._buildParams.message.interactiveMessage.footer.text = text;

			return this;
		}

		header(text, media) {
			this._buildParams.message.interactiveMessage.header.title = text;
			this._media = media;

			return this;
		}

		async render() {
			this._media = !this._media ? { hasMediaAttachment: false } : await this.prepareMessage(this._media);

			this._buildParams.message.interactiveMessage.header = {
				...this._buildParams.message.interactiveMessage.header,
				...this._media
			};

			this._buildParams.message.interactiveMessage.nativeFlowMessage.buttons = this._buttons;

			const message = generateWAMessageFromContent(
				'0@s.whatsapp.net',
				{
					viewOnceMessage: this._buildParams
				},
				{ messageId: generateMessageID() }
			);

			return message;
		}

		async send() {
			this._media = !this._media ? { hasMediaAttachment: false } : await this.prepareMessage(this._media);

			this._buildParams.message.interactiveMessage.header = {
				...this._buildParams.message.interactiveMessage.header,
				...this._media
			};
			this._buildParams.message.interactiveMessage.nativeFlowMessage.buttons = this._buttons;

			const {
				key: { id },
				message
			} = generateWAMessageFromContent(
				'0@s.whatsapp.net',
				{
					viewOnceMessage: this._buildParams
				},
				{ messageId: generateMessageID() }
			);

			await relay(this._destination, message, { messageId: id });
		}

		buttons(...buttons) {
			this._buttons = buttons;

			return this;
		}

		async getMessageType(media) {
			const mime = (await fileTypeFromBuffer(media))?.mime;
			const messageType = mime.includes('gif') || mime.includes('video') ? 'videoMessage' : 'imageMessage';

			return { mime, messageType };
		}

		async prepareGif(media, messageType) {
			const id = Date.now();
			const filepath = (u) => `./src/media/temporary_files/${u}`;

			const inputPath = filepath(`input-${id}.gif`);
			const outputPath = filepath(`output-${id}.mp4`);

			await fs.writeFile(inputPath, media);

			const { output } = await gif2mp4(inputPath, outputPath);

			const fileBuffer = await fs.readFile(output);

			const preparedMedia = await prepareMedia(fileBuffer, messageType);

			preparedMedia.message[messageType].gifPlayback = true;

			await unlink(inputPath);
			await unlink(outputPath);

			return preparedMedia;
		}

		async prepareMessage(media) {
			if (isBuffer(media)) {
				const { mime, messageType } = await this.getMessageType(media);
				let preparedMedia = null;

				if (mime === 'image/gif') {
					preparedMedia = await this.prepareGif(media, messageType);
				} else {
					preparedMedia = await prepareMedia(media, messageType);
				}

				return {
					[messageType]: preparedMedia.message[messageType],
					hasMediaAttachment: true
				};
			} else if (typeof media === 'string') {
				if (isURL(media)) {
					const response = await fetch(media);
					const buffer = Buffer.from(await response.arrayBuffer(), 'base64');
					const { mime, messageType } = await this.getMessageType(buffer);
					let preparedMedia = null;

					if (mime === 'image/gif') {
						preparedMedia = await this.prepareGif(buffer, messageType);
					} else {
						preparedMedia = await prepareMedia(buffer, messageType);
					}

					return {
						[messageType]: preparedMedia.message[messageType],
						hasMediaAttachment: true
					};
				} else {
					const messageType = 'imageMessage';

					return {
						[messageType]: (await prepareMedia(Buffer.alloc(10), messageType)).message[messageType],
						hasMediaAttachment: true
					};
				}
			} else {
				const messageType = 'imageMessage';

				return {
					[messageType]: (await prepareMedia(Buffer.alloc(10), messageType)).message[messageType],
					hasMediaAttachment: true
				};
			}
		}
	}

	/**
	 * @type {import('../../types/Commands/Interactive.js').TemplateBuilder}
	 */
	class TemplateBuilder {
		static Carousel = Carousel;
		static Native = Native;
	}

	const generateProfilePicture = async (mediaUpload, type) => {
		let bufferOrFilePath;

		if (isBuffer(mediaUpload)) {
			bufferOrFilePath = mediaUpload;
		} else if (isURL(mediaUpload)) {
			bufferOrFilePath = await fetchBUFFER(mediaUpload);
		}

		let image = sharp(bufferOrFilePath);

		const { width, height } = await image.metadata();

		let targetWidth = 640;
		let targetHeight = 640;

		if (type === 'no_crop') {
			const aspectRatio = width / height;

			if (width > height) {
				targetWidth = 300;
				targetHeight = Math.round(targetWidth / aspectRatio);
			} else if (width < height) {
				targetHeight = 700;
				targetWidth = Math.round(targetHeight * aspectRatio);
			}

			image = image
				.resize({
					width: targetWidth,
					height: targetHeight
				})
				.jpeg();
		} else if (type === 'no_stretch') {
			const min = Math.min(width, height);
			const cropped = image
				.extract({ left: 0, top: 0, width: min, height: min })
				.resize(640, 640, { fit: 'fill' })
				.jpeg({ quality: 50 });

			image = cropped;
		} else {
			image = image
				.resize({
					width: targetWidth,
					height: targetHeight
				})
				.jpeg();
		}

		return {
			image: await image.toBuffer()
		};
	};

	Object.assign(client.instance, {
		send,
		applyExif,
		TemplateBuilder,
		relay,
		generateMessageID,

		/**
		 * Send and reply any user message.
		 * @type {import('../../types/Utils/index.js').ReplyMessage}
		 */
		reply: async (jid, text, message) =>
			await send(
				jid,
				{ text },
				{
					quoted: message,
					ephemeralExpiration: configuration.cache.users?.get(jid)?.ephemeralDuration || null
				}
			),
		/**
		 * Prepare media before sending it as readable WhatsApp sticker.
		 * @type {import('../../types/Utils/index.js').PrepareSticker}
		 */
		prepareSticker: async (media, type, exif) => {
			const isMediaURL = isBuffer(media) ? false : isURL(media) ? true : false;

			media = isMediaURL ? Buffer.from(await (await fetch(media)).arrayBuffer(), 'base64') : media;

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
				media = await new Promise((resolve, reject) => {
					const output = ffmpeg(Readable.from(media))
						.videoCodec('libwebp')
						.outputOptions('-fs 800k')
						.outputFPS(15)
						.videoBitrate('500k')
						.videoFilter(
							'scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,setsar=1'
						)
						.duration(10)
						.format('webp')
						.on('error', reject)
						.pipe();

					const chunks = [];

					output.on('data', (chunk) => chunks.push(chunk));
					output.on('end', () => resolve(Buffer.concat(chunks)));
					output.on('error', reject);
				});
			} else if (bufferType === 'sticker') {
				return await applyExif(media, exif);
			} else {
				media = await sharp(media, { animated: bufferType === 'video' })
					.resize(512, 512, {
						fit: sharp.fit.contain,
						background: { r: 0, g: 0, b: 0, alpha: 0 }
					})
					.webp()
					.toBuffer();
			}

			return await applyExif(media, exif);
		},

		/**
		 * Download WhatsApp media and save it to local drive.
		 * @type {import('../../types/Utils/index.js').DownloadAndSave}
		 */
		downloadAndSaveMediaMessage: (media, path, type) =>
			new Promise(async (resolve) => {
				const msg = await downloadContentFromMessage(media, type.replace(/Message/g, ''));
				const buffer = await toBuffer(msg);

				await writeFile(path, buffer);

				resolve(path);
			}),

		/**
		 * Download WhatsApp media and returns it as buffer | stream.
		 * @type {import('../../types/Utils/index.js').DownloadMedia}
		 */
		downloadMediaMessage: async (media, typeDownloadable = 'buffer') => {
			return await downloadMessage(media, typeDownloadable);
		},

		/**
		 * Send button text.
		 * @type {import('../../types/Utils/index.js').SendButtonText}
		 */
		buttonText: async (jid, contentText, footerText, buttons, options = {}) => {
			if (!buttons.length) {
				return new Error('Buttons is empty');
			}

			return await send(
				jid,
				{
					text: contentText,
					footer: footerText,
					buttons,
					headerType: 1,
					contextInfo: options.contextInfo
				},
				options
			);
		},

		prepareMedia,

		/**
		 * Send button document.
		 * @type {import('../../types/Utils/index.js').SendButtonDocument}
		 */
		buttonDocument: async (jid, contentText, footerText, buttons, media, options = {}) => {
			if (!buttons.length) {
				return new Error('Buttons is empty');
			}

			const document = await prepareMedia(media, 'documentMessage', options);

			const message = generateWAMessageFromContent(
				ZERO,
				{
					buttonsMessage: {
						buttons,
						contentText,
						footerText,
						headerType: 3,
						contextInfo: options.contextInfo,
						documentMessage: document.message.documentMessage
					}
				},
				options
			);

			await client.instance.relay(jid, message.message, { messageId: message.key.id });

			process.nextTick(async () => {
				await client.instance.upsertMessage(message, 'append');
			});

			return message;
		},

		/**
		 * Send button location.
		 * @type {import('../../types/Utils/index.js').SendButtonLocation}
		 */
		buttonLocation: async (jid, contentText, footerText, buttons, media, options = {}) => {
			if (!buttons.length) {
				return new Error('Buttons is empty');
			}

			const location = await generateWAMessage(
				ZERO,
				{ location: { degreesLatitude: 0, degreesLongitude: 0, jpegThumbnail: media, name: 'provided by nanda' } },
				options
			);

			const message = generateWAMessageFromContent(
				ZERO,
				{
					buttonsMessage: {
						buttons,
						contentText,
						footerText,
						headerType: 6,
						contextInfo: options.contextInfo,
						locationMessage: location.message.locationMessage
					}
				},
				options
			);

			await client.instance.relayMessage(jid, message.message, { messageId: message.key.id });

			process.nextTick(async () => {
				await client.instance.upsertMessage(message, 'append');
			});

			return message;
		},

		/**
		 * Set profile info of the bot.
		 * @type {import('../../types/Utils/index.js').SetInfo}
		 */
		setStatus: async (status) => {
			if (!status) {
				return new Error('Status is empty');
			}

			return await client.instance.query({
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
		 * @type {import('../../types/Utils/index.js').UpdateGroup}
		 */
		updateGroup: async (jid, update, participants, adminGroups, { force = false, message = null, texts = '' } = {}) => {
			const responses = [];

			const quoted = message
				? {
						quoted: message
					}
				: {};

			if (update.isExist('ADD', 'REMOVE', 'DEMOTE', 'PROMOTE')) {
				for (const participant of participants) {
					try {
						if (!force && adminGroups.includes(participant) && update === 'REMOVE') {
							await send(
								jid,
								{
									text: `You can't ${update} @${
										participant.split('@')[0]
									} because it's admin group.\nadd --force flag to force update admin`,
									mentions: [participant]
								},
								quoted
							);

							continue;
						}

						if (adminGroups.includes(participant) && update === 'PROMOTE') {
							await send(
								jid,
								{
									text: `You can't ${update} @${participant.split('@')[0]} because they already an admin group.`,
									mentions: [participant]
								},
								quoted
							);

							continue;
						}

						if (!adminGroups.includes(participant) && update === 'DEMOTE') {
							await send(
								jid,
								{
									text: `You can't ${update} @${participant.split('@')[0]} because they already a member group.`,
									mentions: [participant]
								},
								quoted
							);

							continue;
						}

						const response = await client.instance[UPDATE[update]](jid, [participant], update.toLowerCase());

						if (update.isExist('ADD')) {
							if (response?.[0]?.status === '500') {
								await send(jid, { text: 'Group is already full' }, quoted);
							} else if (response?.[0]?.status === '408') {
								await send(jid, { text: `${participant} is just left a while ago` }, quoted);
							} else if (response?.[0]?.status === '403') {
								await send(
									jid,
									{ text: `${participant} is privated their number. Trying to invite them via invitational message.` },
									quoted
								);

								const messages = generateWAMessageFromContent(
									jid,
									{
										groupInviteMessage: {
											groupJid: jid,
											inviteCode: response?.[0]?.code,
											inviteExpiration: response?.[0]?.expiration,
											groupName: (await client.instance.groupMetadata(jid)).subject,
											caption: 'Invitation to join my WhatsApp group',
											jpegThumbnail: await fetchBUFFER(await client.instance.profilePictureUrl(jid, 'preview'))
										}
									},
									{}
								);

								await client.instance.relayMessage(participant, messages.message, { messageId: messages.key.id });

								process.nextTick(async () => {
									await client.instance.upsertMessage(message, 'append');
								});
							} else if (response?.[0]?.status === '401') {
								await send(jid, { text: `${participant} blocked bot number` }, quoted);
							}
						}

						responses.push(response);
					} catch (e) {
						responses.push({ error: e.message, id: participant });

						if (e?.[0]?.status === '400') {
							await send(jid, { text: `${participant} is not a valid number` }, quoted);
						}

						return;
					}
				}
			}

			if (update.isExist('SUBJECT', 'DESCRIPTION')) {
				const response = await client.instance[UPDATE[update]](jid, texts);

				responses.push(response);
			}

			if (update.isExist('ANNOUNCEMENT', 'NOT_ANNOUNCEMENT', 'UNLOCKED', 'LOCKED')) {
				const response = await client.instance[UPDATE[update]](jid, update.toLowerCase());

				responses.push(response);
			}

			if (update.isExist('RETRIEVE', 'REVOKE')) {
				const response = await client.instance[UPDATE[update]](jid);

				responses.push(response);
			}

			return responses;
		},

		/**
		 * Search a message from the destination.
		 * @type {import('../../types/Utils/index.js').SearchMessage}
		 */
		searchMessage: async (jid, query) => {
			let i = 0;
			const containers = store.loadMessages(jid);
			const keys = [];

			if (!containers.length) {
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
		},

		/**
		 * Parse JID.
		 * @type {import('../../types/Utils/index.js').DecodeJid}
		 */
		decodeJid: (jid) => {
			const { user, server } = jidDecode(jid);

			return user + '@' + server;
		},

		/**
		 * Clear type of message to get real type media.
		 * @type {import('../../types/Utils/index.js').ClearType}
		 */
		clearType: (type, mime = '') => {
			if (type === 'imageMessage' || type === 'videoMessage') {
				return type.replace(/Message/, '');
			} else if (type === 'documentMessage' || type === 'documentWithCaptionMessage' || type === 'stickerMessage') {
				return mime;
			} else {
				return type;
			}
		},

		/**
		 * Get participants of the story on host account.
		 * @type {import('../../types/Utils/index.js').GetStoryParticipants}
		 */
		getStoryParticipants: async (client) => {
			const node = await getStoryParticipantsNode(client);
			const mode = node.content[0].content.find((v) => v.attrs?.default === 'true').attrs.type;

			let jids = (await getAllContacts(prisma)).map((v) => v.id);

			if (mode === 'whitelist') {
				jids = node.content[0].content.find((v) => v.attrs?.type === 'whitelist').content.map((v) => v.attrs?.jid);
			} else if (mode === 'blacklist') {
				const blacklistedContact =
					node.content[0].content.find((v) => v.attrs?.type === 'blacklist').content?.map((v) => v.attrs?.jid) || [];

				if (blacklistedContact.length) {
					jids = jids.filter((v) => !blacklistedContact.includes(v));
				}
			}

			return jids;
		},

		/**
		 * Change Profile Picture of the Host or Group.
		 * @type {import('../../types/Utils/index.js').UpdateProfilePicture}
		 */
		updateProfilePicture: async (jid, media, option) => {
			if (!jid) {
				throw new Error(
					'Illegal no-jid profile update. Please specify either your ID or the ID of the chat you wish to update'
				);
			}

			let targetJid;

			if (jidNormalizedUser(jid) !== jidNormalizedUser(client.instance.authState.creds.me.id)) {
				targetJid = jidNormalizedUser(jid);
			} else {
				targetJid = undefined;
			}

			const { image } = await generateProfilePicture(media, option);

			await client.instance.query({
				tag: 'iq',
				attrs: {
					...(targetJid ? { target: targetJid } : {}),
					to: S_WHATSAPP_NET,
					type: 'set',
					xmlns: 'w:profile:picture'
				},
				content: [
					{
						tag: 'picture',
						attrs: { type: 'image' },
						content: image
					}
				]
			});
		},

		/**
		 * Send waits message and update function.
		 * @type {import('../../types/Utils/index.js').WaitMessage}
		 */
		waitMessage: async (jid, message, quoted) => {
			const { key } = await send(
				jid,
				{
					text: message
				},
				{ quoted, ephemeralExpiration: configuration.cache.users?.get(jid)?.ephemeralDuration || null }
			);

			/**
			 * @type {import('../../types/Utils/index.js').UpdateMessage}
			 */
			const update = async (message) => {
				client.instance.sendMessage(jid, { edit: key, text: message });
			};

			return {
				update
			};
		},

		/**
		 * Edit message
		 * @type {import('../../types/Utils/index.js').EditMessage}
		 */
		edit: async (jid, message, key) => {
			await client.instance.sendMessage(jid, { edit: key, text: message });
		},
		jidNormalizedUser
	});

	return client;
};
