import {
	downloadContentFromMessage,
	downloadMediaMessage as downloadMessage,
	generateWAMessage,
	generateWAMessageFromContent,
	toBuffer
} from '@adiwajshing/baileys';
import { fileTypeFromBuffer } from 'file-type';
import ffmpeg from 'fluent-ffmpeg';
import webpmux from 'node-webpmux';
import sharp from 'sharp';
import { TextEncoder } from 'util';
import { fetch } from 'undici';

import configuration from '../config/connect.js';
import { S_WHATSAPP_NET, UPDATE, ZERO } from '../misc/wa_data/index.js';
import { isURL, fetchBUFFER } from '../../utils/modules/index.js';
import { reassign } from './parse-message.js';

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

	client.instance = {
		...client.instance,
		send,
		applyExif,

		/**
		 * Send and reply any user message.
		 * @type {import('../../types/Utils/index.js').ReplyMessage}
		 */
		reply: async (text, { from, groupMetadata, quoted }) =>
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
		 * @type {import('../../types/Utils/index.js').PrepareSticker}
		 */
		prepareSticker: async (media, filename, type, exif) => {
			const isMediaURL = Buffer.isBuffer(media) ? false : isURL(media) ? true : false;

			media = isMediaURL ? Buffer.from(await (await fetch(media)).arrayBuffer(), 'base64') /* eslint-disable-line */ : media;

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
			if (buttons.length === 0) {
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
			if (buttons.length === 0) {
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

	return client;
};
