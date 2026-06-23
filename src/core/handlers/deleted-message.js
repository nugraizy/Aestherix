import { BOT_NAME } from '../constants.js';

import dayjs from 'dayjs';
import fs from 'fs-extra';

import configuration from '../../helper/config/connect.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { color, getFilesize, getFilesizeFromBytes, loggers } from '../../utils/modules/index.js';
import { Context } from '../context.js';

/**
 * @param {import('../../types/Socket/index.js').AdvancedClient} client
 * @param {import('../../types/Messages/index.js').WAMessage} message
 * @param {boolean} fetches
 * @param {import('../../types/Socket/index.js').Store} store
 */
const deletedHandler = async (client, message, fetches) => {
	try {
		if (!message) {
			return;
		}

		message = await Context.from(JSON.parse(JSON.stringify(message)), client);

		if (message?.error) {
			return;
		}

		const {
			from,
			mention: mentioning,
			timeStamp,
			sender,
			body,
			pushname,
			extractMediaData,
			filename,
			isBotInstance,
			isFromMe,
			mediaData
		} = message;

		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		const messages = message?.message?.message;

		if (!messages || isBotInstance || isFromMe || from === 'status@broadcast') {
			return;
		}

		const type = Object.keys(messages)[0];

		if (!type || type === 'protocolMessage' || type === 'senderKeyDistributionMessage') {
			return;
		}

		const groupSettings = configuration.groups.settings.get(from);
		const stats = groupSettings?.antiDelete === 'enable' || fetches;

		if (stats) {
			const options = {
				quoted: message.message,
				contextInfo: {
					mentionedJid: []
				}
			};

			options.contextInfo.mentionedJid.push(sender, ...mentioning);

			let quotedMessage = '';

			if (messages[type]?.contextInfo?.quotedMessage) {
				const quotedType = Object.keys(messages[type].contextInfo.quotedMessage)[0];
				const quotedContent = messages[type].contextInfo.quotedMessage[quotedType];

				quotedMessage = buildQuotedMessage(quotedType, quotedContent, L); // eslint-disable-line
			}

			switch (type) {
				case 'extendedTextMessage':
				case 'conversation':
					{
						const stringDeleted = buildDeletedTextMessage(pushname, type, timeStamp, body || L.core.deleted.unknown, quotedMessage, L); // eslint-disable-line

						await sendMessageWithMentions(client, from, stringDeleted, options); // eslint-disable-line
					}

					break;
				case 'stickerMessage':
					{
						const result = await client.downloadMediaMessage(message?.message, 'buffer');
						const fileSize = getFilesizeFromBytes(Buffer.byteLength(result));
						const sticker = await prepareAndSendSticker(client, result, mediaData.message.stickerMessage.isAnimated);
						const stringDeleted = buildDeletedTextMessage(pushname, type, timeStamp, `\n${L.core.deleted.size}${fileSize}`, quotedMessage, L);

						await client.send(from, { sticker }, options);
						await sendMessageWithMentions(client, from, stringDeleted, options); // eslint-disable-line
					}

					break;
				case 'imageMessage':
					{
						const image = await downloadAndSaveMediaMessage(client, extractMediaData, filename, 'imageMessage'); // eslint-disable-line
						const fileSize = getFilesize(image);
						const stringDeleted = buildDeletedTextMessage(pushname, type, timeStamp, `\n${L.core.deleted.size}${fileSize}`, quotedMessage, L); // eslint-disable-line

						await sendImageMessageWithCaption(client, from, image, stringDeleted, options); // eslint-disable-line
						await fs.unlink(image);
					}

					break;
				case 'videoMessage':
					{
						const video = await downloadAndSaveMediaMessage(client, extractMediaData, filename, 'videoMessage'); // eslint-disable-line
						const fileSize = getFilesize(video);
						const stringDeleted = buildDeletedTextMessage(pushname, type, timeStamp, `\n${L.core.deleted.size}${fileSize}`, quotedMessage, L); // eslint-disable-line

						await sendVideoMessageWithCaption(client, from, video, stringDeleted, options); // eslint-disable-line
						await fs.unlink(video);
					}

					break;
				case 'audioMessage':
					{
						const audio = await downloadAndSaveMediaMessage(client, extractMediaData, filename, 'audioMessage'); // eslint-disable-line
						const fileSize = getFilesize(audio);
						const audioType = extractMediaData.ptt ? L.core.deleted.voiceNote : L.core.deleted.audioFile;
						const mimeType = extractMediaData.mimetype;
						const stringDeleted = buildAudioDeletedTextMessage(
							pushname,
							type,
							timeStamp,
							audioType,
							mimeType,
							`${L.core.deleted.size}${fileSize}`,
							quotedMessage,
							L
						);

						await sendAudioMessageWithCaption(client, from, audio, stringDeleted, options); // eslint-disable-line
						await fs.unlink(audio);
					}

					break;
				case 'contactMessage':
					{
						const stringDeleted = buildContactDeletedTextMessage(
							pushname,
							type,
							timeStamp,
							extractMediaData.displayName,
							quotedMessage,
							L
						);

						await sendContactMessage(
							client,
							from,
							extractMediaData.displayName,
							extractMediaData.vcard,
							stringDeleted,
							options
						);
					}

					break;
				case 'contactsArrayMessage':
					{
						const stringDeleted = buildContactsArrayDeletedTextMessage(
							pushname,
							type,
							timeStamp,
							extractMediaData.contacts,
							quotedMessage,
							L
						);

						await sendContactsArrayMessage(
							client,
							from,
							extractMediaData.displayName,
							extractMediaData.contacts,
							stringDeleted,
							options
						);
					}

					break;
				case 'locationMessage':
				case 'liveLocationMessage':
					{
						const stringDeleted = buildLocationDeletedTextMessage(
							pushname,
							type,
							timeStamp,
							extractMediaData.degreesLatitude,
							extractMediaData.degreesLongitude,
							quotedMessage,
							L
						);

						await sendLocationMessage(
							client,
							from,
							extractMediaData.degreesLatitude,
							extractMediaData.degreesLongitude,
							extractMediaData.jpegThumbnail,
							stringDeleted,
							options
						);
					}

					break;
			}
		}
	} catch (err) {
		loggers.error(color('Deleted message handler failed:', 'red'), err);
	}
};

const buildQuotedMessage = (type, content, L) => {
	switch (type) {
		case 'conversation':
			return `\n\n${L.core.deleted.repliedTo}${content.conversation || L.core.deleted.unknown}`;
		case 'extendedTextMessage':
			return `\n\n${L.core.deleted.repliedTo}${content.text || L.core.deleted.unknown}`;
		case 'documentMessage':
			return `\n\nReplied to :\nFilename : ${content.fileName || L.core.deleted.unknown}\nMimetype : ${content.mimetype || L.core.deleted.unknown}`;
		case 'locationMessage':
			return `\n\nReplied to :\nLat : ${content.degreesLatitude || L.core.deleted.unknown}\nLong : ${content.degreesLongitude || L.core.deleted.unknown}`;
		case 'contactMessage':
			return `\n\nReplied to :\nDisplayname : ${content.displayName || L.core.deleted.unknown}`;
		case 'contactsArrayMessage':
			const contacts = content.contacts || [];
			const contactNames = contacts.map((contact) => contact.displayName || L.core.deleted.unknown).join('\n');

			return `\n\nReplied to :\nTotal Contact : ${contacts.length || 0}\nList Name :\n${contactNames}`;
		case 'imageMessage':
		case 'videoMessage':
			return `\n\n${L.core.deleted.repliedTo}${content.caption || L.core.deleted.noCaption}`;
		case 'audioMessage':
			return content.ptt ? `\n\n${L.core.deleted.repliedAudio}${L.core.deleted.voiceNote}` : `\n\n${L.core.deleted.repliedAudio}${L.core.deleted.audioFile}`;
		case 'stickerMessage':
			return '';
		default:
			return '';
	}
};

const buildDeletedTextMessage = (pushname, type, timeStamp, body, quotedMessage, L) => {
	return `${'```' + L.core.deleted.messageDeleted + '```'}
${L.core.deleted.name}${pushname}
${L.core.deleted.type}${type}
${L.core.deleted.time}${dayjs.unix(timeStamp).format('HH:mm:ss DD/MM/YYYY')}
${L.core.deleted.message}${body}${quotedMessage}
`.trim();
};

const buildAudioDeletedTextMessage = (pushname, type, timeStamp, audioType, mimeType, fileSize, quotedMessage, L) => {
	return `${'```' + L.core.deleted.messageDeleted + '```'}
${L.core.deleted.name}${pushname}
${L.core.deleted.type}${type}
${L.core.deleted.time}${dayjs.unix(timeStamp).format('HH:mm:ss DD/MM/YYYY')}
${L.core.deleted.audioType || 'Audio Type : '}${audioType}
${L.core.deleted.mimetype}${mimeType}
${L.core.deleted.size}${fileSize}${quotedMessage}
`.trim();
};

const buildContactDeletedTextMessage = (pushname, type, timeStamp, displayName, quotedMessage, L) => {
	return `${'```' + L.core.deleted.messageDeleted + '```'}
${L.core.deleted.name}${pushname}
${L.core.deleted.type}${type}
${L.core.deleted.time}${dayjs.unix(timeStamp).format('HH:mm:ss DD/MM/YYYY')}
${L.core.deleted.displayname}${displayName}${quotedMessage}
`.trim();
};

const buildContactsArrayDeletedTextMessage = (pushname, type, timeStamp, contacts, quotedMessage, L) => {
	const contactNames = contacts.map((contact, index) => `${index + 1}. ${contact.displayName || L.core.deleted.unknown}`).join('\n');

	return `${'```' + L.core.deleted.messageDeleted + '```'}
${L.core.deleted.name}${pushname}
${L.core.deleted.type}${type}
${L.core.deleted.time}${dayjs.unix(timeStamp).format('HH:mm:ss DD/MM/YYYY')}
${L.core.deleted.displayname}
${contactNames}${quotedMessage}
`.trim();
};

const buildLocationDeletedTextMessage = (pushname, type, timeStamp, lat, long, quotedMessage, L) => {
	return `${'```' + L.core.deleted.messageDeleted + '```'}
${L.core.deleted.name}${pushname}
${L.core.deleted.type}${type}
${L.core.deleted.time}${dayjs.unix(timeStamp).format('HH:mm:ss DD/MM/YYYY')}
${L.core.deleted.lat}${lat}
${L.core.deleted.long}${long}${quotedMessage}
`.trim();
};

const sendMessageWithMentions = async (client, from, message, options) => {
	await client.send(from, { text: message, mentions: options.contextInfo.mentionedJid }, options);
};

const prepareAndSendSticker = async (client, data, isAnimated) => {
	const sticker = await client.prepareSticker(data, isAnimated ? 'stickerAnimated' : 'imageMessage', {
		author: configuration.author,
		packname: configuration.packname
	});

	return sticker;
};

const downloadAndSaveMediaMessage = async (client, data, filename, messageType) => {
	const savedPath = `./tmp/${filename}.${data.mimetype.split('/')[1]}`;

	await client.downloadAndSaveMediaMessage(data, savedPath, messageType);

	return savedPath;
};

const sendImageMessageWithCaption = async (client, from, image, caption, options) => {
	await client.send(
		from,
		{ image: await fs.readFile(image), caption: caption, mention: options.contextInfo.mentionedJid },
		options
	);
};

const sendVideoMessageWithCaption = async (client, from, video, caption, options) => {
	await client.send(
		from,
		{ video: await fs.readFile(video), caption: caption, mention: options.contextInfo.mentionedJid },
		options
	);
};

const sendAudioMessageWithCaption = async (client, from, audio, caption, options) => {
	await client.send(from, { audio: await fs.readFile(audio) }, options);
	await client.send(from, { text: caption }, options);
};

const sendContactMessage = async (client, from, displayName, vcard, caption, options) => {
	await client.send(from, { contacts: { displayName: displayName, contacts: [{ vcard: vcard }] } }, options);
	await client.send(from, { text: caption }, options);
};

const sendContactsArrayMessage = async (client, from, displayName, contacts, caption, options) => {
	await client.send(from, { contacts: { displayName: displayName, contacts: contacts } }, options);
	await client.send(from, { text: caption }, options);
};

const sendLocationMessage = async (client, from, lat, long, jpegThumbnail, caption, options) => {
	await client.send(
		from,
		{
			location: {
				degreesLatitude: lat,
				degreesLongitude: long,
				jpegThumbnail: jpegThumbnail,
				name: `Provided by Nanda, ${BOT_NAME}. Powered by Hidden Finder`
			}
		},
		options
	);
	await client.send(from, { text: caption }, options);
};

export default deletedHandler;
