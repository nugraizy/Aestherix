import {
	downloadContentFromMessage,
	downloadMediaMessage as downloadMessage,
	generateWAMessage,
	generateWAMessageFromContent,
	toBuffer,
	jidDecode,
	generateMessageIDV2,
	isJidGroup
} from 'baileys';
import { fileTypeFromBuffer } from 'file-type';
import ffmpeg from 'fluent-ffmpeg';
import webpmux from 'node-webpmux';
import sharp from 'sharp';
import { TextEncoder } from 'util';
import { fetch } from 'undici';
import fs from 'fs-extra';

import configuration from '../config/connect.js';
import { S_WHATSAPP_NET, UPDATE, ZERO } from '../misc/wa_data/index.js';
import { isURL, fetchBUFFER } from '../../utils/modules/index.js';
import { reassign } from './parse-message.js';
import { gif2mp4 } from '../../utils/index.js';

const { readFile, unlink, writeFile } = (await import('fs-extra')).default;

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
				  })(); /* eslint-disable-line */
		buffer.exif = exif;

		return await buffer.save(null);
	};

	/**
	 * Send any message.
	 * @type {import('../../types/Utils/index.js').SendMessage}
	 */
	const send = async (to, message, options) => {
		options = {
			...options,
			...(isJidGroup(to) && { useCachedGroupMetadata: true }),
			ephemeralExpiration:
				options?.groupMetadata?.ephemeralDuration ||
				configuration.cache.metadata?.get(to)?.ephemeralDuration ||
				configuration.cache.users?.get(to)?.ephemeralDuration ||
				0,
			messageId: 'HFINDER' + generateMessageIDV2(to)
		};

		if ('buttons' in message || 'templateButtons' in message) {
			delete message.buttons;
			delete message.footer;
			delete message.headerType;
			delete message.templateButtons;
			delete message.title;
			delete message.buttonText;
			delete message.sections;
		}

		if (('image' in message || 'video' in message) && 'footer' in message) {
			if (message.caption) {
				message.caption = `${message?.caption}\n\n${message.footer}`?.trim();
			}
		}

		if ((message?.video || message?.image || message?.document || message?.audio)?.url) {
			const buffer = Buffer.from(
				await fetchBUFFER((message.video || message.image || message.document || message.audio)?.url),
				'base64'
			);

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

		return client.instance.sendMessage(to, message, options);
	};

	const getStoryParticipantsNode = (client) =>
		client.instance.query({
			tag: 'iq',
			attrs: {
				id: generateMessageIDV2(),
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
						display_text: data.display /* eslint-disable-line */,
						copy_code: data.code /* eslint-disable-line */
					})
				};
			},

			reply(data) {
				return {
					name: 'quick_reply',
					buttonParamsJson: JSON.stringify({
						display_text: data.display /* eslint-disable-line */,
						id: data.id
					})
				};
			},

			url(data) {
				return {
					name: 'cta_url',
					buttonParamsJson: JSON.stringify({
						display_text: data.display /* eslint-disable-line */,
						url: data.url,
						merchant_url: data.url /* eslint-disable-line */
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
						display_text: data.display /* eslint-disable-line */,
						id: data.id
					})
				};
			},

			reminder(data) {
				return {
					name: 'cta_reminder',
					buttonParamsJson: JSON.stringify({
						display_text: data.display /* eslint-disable-line */,
						id: data.id
					})
				};
			},

			cancel(data) {
				return {
					name: 'cta_cancel_reminder',
					buttonParamsJson: JSON.stringify({
						display_text: data.display /* eslint-disable-line */,
						id: data.id
					})
				};
			},

			address(data) {
				return {
					name: 'address_message',
					buttonParamsJson: JSON.stringify({
						display_text: data.display /* eslint-disable-line */,
						id: data.id
					})
				};
			},

			location() {
				return {
					name: 'send_location',
					buttonParamsJson: ''
				};
			}
		};
	}

	class Carousel extends InteractiveButtons {
		constructor(client) {
			super();

			/**
			 * @private
			 */
			this.client = client;

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

		async render() {
			this._cards = await Promise.all(this._cards);
			this._media = !this._media ? { hasMediaAttachment: false } : await this.prepareMessage(this._media);

			this._buildParams.message.interactiveMessage.carouselMessage.cards = this._cards;
			this._buildParams.message.interactiveMessage.header = {
				...this._buildParams.message.interactiveMessage.header,
				...this._media
			};

			return generateWAMessageFromContent(
				'0@s.whatsapp.net',
				{
					viewOnceMessage: this._buildParams
				},
				{}
			);
		}

		mainBody(text) {
			this._buildParams.message.interactiveMessage.body.text = text;

			return this;
		}

		mainFooter(text) {
			this._buildParams.message.interactiveMessage.footer.text = text;

			return this;
		}

		mainHeader(text, media) {
			this._buildParams.message.interactiveMessage.header.text = text;
			this._media = media;

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

			await writeFile(filepath(`input-${id}.gif`), media);

			const { output } = await gif2mp4(filepath(`input-${id}.gif`), filepath(`output-${id}.mp4`));

			const preparedMedia = await this.client.instance.prepareMedia({ url: output }, messageType);

			preparedMedia.message[messageType].gifPlayback = true;

			await unlink(filepath(`input-${id}.gif`));
			await unlink(filepath(`output-${id}.mp4`));

			return preparedMedia;
		}

		async prepareMessage(media) {
			if (Buffer.isBuffer(media)) {
				const { mime, messageType } = await this.getMessageType(media);
				let preparedMedia = null;

				if (mime === 'image/gif') {
					preparedMedia = await this.prepareGif(media, messageType);
				} else {
					preparedMedia = await this.client.instance.prepareMedia(media, messageType);
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
						preparedMedia = await this.client.instance.prepareMedia(buffer, messageType);
					}

					return {
						[messageType]: preparedMedia.message[messageType],
						hasMediaAttachment: true
					};
				} else {
					const messageType = 'imageMessage';

					return {
						[messageType]: (await this.client.instance.prepareMedia(Buffer.alloc(10), messageType)).message[messageType],
						hasMediaAttachment: true
					};
				}
			} else {
				const messageType = 'imageMessage';

				return {
					[messageType]: (await this.client.instance.prepareMedia(Buffer.alloc(10), messageType)).message[messageType],
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
		constructor(client) {
			super();

			/**
			 * @private
			 */
			this.client = client;

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

		mainBody(text) {
			this._buildParams.message.interactiveMessage.body.text = text;

			return this;
		}

		mainFooter(text) {
			this._buildParams.message.interactiveMessage.footer.text = text;

			return this;
		}

		mainHeader(text, media) {
			this._buildParams.message.interactiveMessage.header.text = text;
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

			return generateWAMessageFromContent(
				'0@s.whatsapp.net',
				{
					viewOnceMessage: this._buildParams
				},
				{}
			);
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

			await writeFile(filepath(`input-${id}.gif`), media);

			const { output } = await gif2mp4(filepath(`input-${id}.gif`), filepath(`output-${id}.mp4`));

			const preparedMedia = await this.client.instance.prepareMedia({ url: output }, messageType);

			preparedMedia.message[messageType].gifPlayback = true;

			await unlink(filepath(`input-${id}.gif`));
			await unlink(filepath(`output-${id}.mp4`));

			return preparedMedia;
		}

		async prepareMessage(media) {
			if (Buffer.isBuffer(media)) {
				const { mime, messageType } = await this.getMessageType(media);
				let preparedMedia = null;

				if (mime === 'image/gif') {
					preparedMedia = await this.prepareGif(media, messageType);
				} else {
					preparedMedia = await this.client.instance.prepareMedia(media, messageType);
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
						preparedMedia = await this.client.instance.prepareMedia(buffer, messageType);
					}

					return {
						[messageType]: preparedMedia.message[messageType],
						hasMediaAttachment: true
					};
				} else {
					const messageType = 'imageMessage';

					return {
						[messageType]: (await this.client.instance.prepareMedia(Buffer.alloc(10), messageType)).message[messageType],
						hasMediaAttachment: true
					};
				}
			} else {
				const messageType = 'imageMessage';

				return {
					[messageType]: (await this.client.instance.prepareMedia(Buffer.alloc(10), messageType)).message[messageType],
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

	client.instance = {
		...client.instance,
		send,
		applyExif,

		/**
		 * Send and reply any user message.
		 * @type {import('../../types/Utils/index.js').ReplyMessage}
		 */
		reply: async (text, { from, quoted }) => {
			await send(
				from,
				{ text },
				{
					quoted,
					ephemeralExpiration: configuration.cache.users?.get(from)?.ephemeralDuration || null
				}
			);
		},

		/**
		 * Prepare media before sending it as readable WhatsApp sticker.
		 * @type {import('../../types/Utils/index.js').PrepareSticker}
		 */
		prepareSticker: async (media, filename, type, exif) => {
			const isMediaURL = Buffer.isBuffer(media) ? false : isURL(media) ? true : false;

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
				const [video, webp] = ['video', 'webp'].map((ext) => `${filename}.${ext}`);

				await writeFile(video, media);

				await new Promise((resolve) => {
					ffmpeg(video)
						.videoCodec('libwebp')
						.outputOptions('-fs 800k')
						.outputFPS(15)
						.videoBitrate('500k')
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
		buttonText: async (to, contentText, footerText, buttons, options = {}) => {
			if (!buttons.length) {
				return new Error('Buttons is empty');
			}

			return await send(
				to,
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
		buttonDocument: async (to, contentText, footerText, buttons, media, options = {}) => {
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

			await client.instance.relayMessage(to, message.message, { messageId: message.key.id });

			process.nextTick(async () => {
				await client.instance.upsertMessage(message, 'append');
			});

			return message;
		},

		/**
		 * Send button location.
		 * @type {import('../../types/Utils/index.js').SendButtonLocation}
		 */
		buttonLocation: async (dari, contentText, footerText, buttons, media, options = {}) => {
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

			await client.instance.relayMessage(dari, message.message, { messageId: message.key.id });

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
		updateGroup: async (to, update, participants, adminGroups, { force = false, message = null, texts = '' } = {}) => {
			const responses = [];

			const quoted = message
				? {
						quoted: message
				  } // eslint-disable-line
				: {};

			if (update.isExist('ADD', 'REMOVE', 'DEMOTE', 'PROMOTE')) {
				for (const participant of participants) {
					try {
						if (!force && adminGroups.includes(participant) && update === 'REMOVE') {
							await send(
								to,
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
								to,
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
								to,
								{
									text: `You can't ${update} @${participant.split('@')[0]} because they already a member group.`,
									mentions: [participant]
								},
								quoted
							);

							continue;
						}

						const response = await client.instance[UPDATE[update]](to, [participant], update.toLowerCase());

						if (update.isExist('ADD')) {
							if (response?.[0]?.status === '500') {
								await send(to, { text: 'Group is already full' }, quoted);
							} else if (response?.[0]?.status === '408') {
								await send(to, { text: `${participant} is just left a while ago` }, quoted);
							} else if (response?.[0]?.status === '403') {
								await send(
									to,
									{ text: `${participant} is privated their number. Trying to invite them via invitational message.` },
									quoted
								);

								const messages = generateWAMessageFromContent(
									to,
									{
										groupInviteMessage: {
											groupJid: to,
											inviteCode: response?.[0]?.code,
											inviteExpiration: response?.[0]?.expiration,
											groupName: (await client.instance.groupMetadata(to)).subject,
											caption: 'Invitation to join my WhatsApp group',
											jpegThumbnail: new Buffer.from(
												await fetchBUFFER(await client.instance.profilePictureUrl(to, 'preview'))
											).toString('base64')
										}
									},
									{}
								);

								await client.instance.relayMessage(participant, messages.message, { messageId: messages.key.id });

								process.nextTick(async () => {
									await client.instance.upsertMessage(message, 'append');
								});
							} else if (response?.[0]?.status === '401') {
								await send(to, { text: `${participant} blocked bot number` }, quoted);
							}
						}

						responses.push(response);
					} catch (e) {
						responses.push({ error: e.message, id: participant });

						if (e?.[0]?.status === '400') {
							await send(to, { text: `${participant} is not a valid number` }, quoted);
						}

						return;
					}
				}
			}

			if (update.isExist('SUBJECT', 'DESCRIPTION')) {
				const response = await client.instance[UPDATE[update]](to, texts);

				responses.push(response);
			}

			if (update.isExist('ANNOUNCEMENT', 'NOT_ANNOUNCEMENT', 'UNLOCKED', 'LOCKED')) {
				const response = await client.instance[UPDATE[update]](to, update.toLowerCase());

				responses.push(response);
			}

			if (update.isExist('RETRIEVE', 'REVOKE')) {
				const response = await client.instance[UPDATE[update]](to);

				responses.push(response);
			}

			return responses;
		},

		/**
		 * Search a message from the destination.
		 * @type {import('../../types/Utils/index.js').SearchMessage}
		 */
		searchMessage: async (to, query) => {
			let i = 0;
			const containers = store.loadMessages(to);
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

			let jids = fs
				.readJSONSync('./databases/users/contacts.json')
				.sortUnique('id')
				.map((v) => v.id);

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
		TemplateBuilder
	};

	return client;
};
