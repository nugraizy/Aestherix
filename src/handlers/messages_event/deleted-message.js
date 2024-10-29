import dayjs from 'dayjs';
import path from 'path';
import fs from 'fs-extra';

import configuration from '../../helper/config/connect.js';
import { getFilesize, getFilesizeFromBytes } from '../../utils/modules/index.js';
import { reassign } from '../../helper/modules/parse-message.js';

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

		message = await reassign(JSON.parse(JSON.stringify(message)), client);

		if (message && 'error' in message) {
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
			isBaileys,
			isFromMe,
			mediaData,
			groupMetadata
		} = message;

		const messages = message?.message?.message;

		if (!messages || isBaileys || isFromMe || from === 'status@broadcast') {
			return;
		}

		const type = Object.keys(messages)[0];

		if (!type || type === 'protocolMessage' || type === 'senderKeyDistributionMessage') {
			return;
		}

		const stats = message[from]?.antiDelete === 'enable' ? true : fetches ? true : false;

		if (stats) {
			const options = {
				groupMetadata,
				quoted: message.message,
				contextInfo: {
					mentionedJid: []
				}
			};

			options.contextInfo.mentionedJid.push(sender, ...mentioning);

			let quotedMessage = '';

			if (messages[type].contextInfo.quotedMessage) {
				const quotedType = Object.keys(messages[type].contextInfo.quotedMessage)[0];
				const quotedContent = messages[type].contextInfo.quotedMessage[quotedType];

				quotedMessage = buildQuotedMessage(quotedType, quotedContent); // eslint-disable-line
			}

			switch (type) {
				case 'extendedTextMessage':
				case 'conversation':
					{
						const stringDeleted = buildDeletedTextMessage(pushname, type, timeStamp, body || 'Unknown', quotedMessage); // eslint-disable-line

						await sendMessageWithMentions(client, from, stringDeleted, options); // eslint-disable-line
					}

					break;
				case 'stickerMessage':
					{
						const result = await client.instance.downloadMediaMessage(mediaData);
						const fileSize = getFilesizeFromBytes(Buffer.byteLength(result));
						const sticker = await /* eslint-disable-line */ prepareAndSendSticker(
							client.instance,
							result,
							filename,
							mediaData.message.stickerMessage.isAnimated
						);
						const stringDeleted = /* eslint-disable-line */ buildDeletedTextMessage(
							pushname,
							type,
							timeStamp,
							`\nSize : ${fileSize}`,
							quotedMessage
						);

						await client.instance.send(from, { sticker }, options);
						await sendMessageWithMentions(client, from, stringDeleted, options); // eslint-disable-line
					}

					break;
				case 'imageMessage':
					{
						const image = await downloadAndSaveMediaMessage(client.instance, extractMediaData, filename, 'imageMessage'); // eslint-disable-line
						const fileSize = getFilesize(image);
						const stringDeleted = buildDeletedTextMessage(pushname, type, timeStamp, `\nSize : ${fileSize}`, quotedMessage); // eslint-disable-line

						await sendImageMessageWithCaption(client.instance, from, image, stringDeleted, options); // eslint-disable-line
						await fs.unlink(image);
					}

					break;
				case 'videoMessage':
					{
						const video = await downloadAndSaveMediaMessage(client.instance, extractMediaData, filename, 'videoMessage'); // eslint-disable-line
						const fileSize = getFilesize(video);
						const stringDeleted = buildDeletedTextMessage(pushname, type, timeStamp, `\nSize : ${fileSize}`, quotedMessage); // eslint-disable-line

						await sendVideoMessageWithCaption(client.instance, from, video, stringDeleted, options); // eslint-disable-line
						await fs.unlink(video);
					}

					break;
				case 'audioMessage':
					{
						const audio = await downloadAndSaveMediaMessage(client.instance, extractMediaData, filename, 'audioMessage'); // eslint-disable-line
						const fileSize = getFilesize(audio);
						const audioType = extractMediaData.ptt ? 'Voice Note' : 'Audio File';
						const mimeType = extractMediaData.mimetype;
						const stringDeleted = /* eslint-disable-line */ buildAudioDeletedTextMessage(
							pushname,
							type,
							timeStamp,
							audioType,
							mimeType,
							`Size : ${fileSize}`,
							quotedMessage
						);

						await sendAudioMessageWithCaption(client.instance, from, audio, stringDeleted, options); // eslint-disable-line
						await fs.unlink(audio);
					}

					break;
				case 'contactMessage':
					{
						const stringDeleted = /* eslint-disable-line */ buildContactDeletedTextMessage(
							pushname,
							type,
							timeStamp,
							extractMediaData.displayName,
							quotedMessage
						);

						/* eslint-disable-line */ await sendContactMessage(
							client.instance,
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
						const stringDeleted = /* eslint-disable-line */ buildContactsArrayDeletedTextMessage(
							pushname,
							type,
							timeStamp,
							extractMediaData.contacts,
							quotedMessage
						);

						/* eslint-disable-line */ await sendContactsArrayMessage(
							client.instance,
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
						const stringDeleted = /* eslint-disable-line */ buildLocationDeletedTextMessage(
							pushname,
							type,
							timeStamp,
							extractMediaData.degreesLatitude,
							extractMediaData.degreesLongitude,
							quotedMessage
						);

						/* eslint-disable-line */ await sendLocationMessage(
							client.instance,
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
		log(err);
	}
};

const buildQuotedMessage = (type, content) => {
	switch (type) {
		case 'conversation':
			return `Message Replied to : ${content.conversation || 'Unknown'}`;
		case 'extendedTextMessage':
			return `Message Replied to : ${content.text || 'Unknown'}`;
		case 'documentMessage':
			return `Filename : ${content.fileName || 'Unknown'}\nMimetype : ${content.mimetype || 'Unknown'}`;
		case 'locationMessage':
			return `Lat : ${content.degreesLatitude || 'Unknown'}\nLong : ${content.degreesLongitude || 'Unknown'}`;
		case 'contactMessage':
			return `Displayname : ${content.displayName || 'Unknown'}`;
		case 'contactsArrayMessage':
			const contacts = content.contacts || [];
			const contactNames = contacts.map((contact) => contact.displayName || 'Unknown').join('\n');

			return `Total Contact : ${contacts.length || 0}\nList Name :\n${contactNames}`;
		case 'imageMessage':
		case 'videoMessage':
			return `Caption : ${content.caption || 'No Caption'}`;
		case 'audioMessage':
			return content.ptt ? 'Type Audio : Voice Note' : 'Type Audio : Audio File';
		case 'stickerMessage':
			return '';
		default:
			return '';
	}
};

const buildDeletedTextMessage = (pushname, type, timeStamp, body, quotedMessage) => {
	return `\`\`\`Message Deleted\n\`\`\`
Name : ${pushname}
Type : ${type}
Time : ${dayjs.unix(timeStamp).format('HH:mm:ss DD/MM/YYYY')}
Message : ${body}${quotedMessage}
`.trim();
};

const buildAudioDeletedTextMessage = (pushname, type, timeStamp, audioType, mimeType, fileSize, quotedMessage) => {
	return `\`\`\`Message Deleted\n\`\`\`
Name : ${pushname}
Type : ${type}
Time : ${dayjs.unix(timeStamp).format('HH:mm:ss DD/MM/YYYY')}
Audio Type : ${audioType}
Mimetype : ${mimeType}
Size : ${fileSize}${quotedMessage}
`.trim();
};

const buildContactDeletedTextMessage = (pushname, type, timeStamp, displayName, quotedMessage) => {
	return `\`\`\`Message Deleted\n\`\`\`
Name : ${pushname}
Type : ${type}
Time : ${dayjs.unix(timeStamp).format('HH:mm:ss DD/MM/YYYY')}
Displayname : ${displayName}${quotedMessage}
`.trim();
};

const buildContactsArrayDeletedTextMessage = (pushname, type, timeStamp, contacts, quotedMessage) => {
	const contactNames = contacts.map((contact, index) => `${index + 1}. ${contact.displayName || 'Unknown'}`).join('\n');

	return `\`\`\`Message Deleted\n\`\`\`
Name : ${pushname}
Type : ${type}
Time : ${dayjs.unix(timeStamp).format('HH:mm:ss DD/MM/YYYY')}
Displayname :
${contactNames}${quotedMessage}
`.trim();
};

const buildLocationDeletedTextMessage = (pushname, type, timeStamp, lat, long, quotedMessage) => {
	return `\`\`\`Message Deleted\n\`\`\`
Name : ${pushname}
Type : ${type}
Time : ${dayjs.unix(timeStamp).format('HH:mm:ss DD/MM/YYYY')}
Lat : ${lat}
Long : ${long}${quotedMessage}
`.trim();
};

const sendMessageWithMentions = async (client, from, message, options) => {
	await client.send(from, { text: message, mentions: options.contextInfo.mentionedJid }, options);
};

const prepareAndSendSticker = async (client, data, filename, isAnimated) => {
	const result = await client.downloadMediaMessage(data);
	const sticker = await client.prepareSticker(
		result,
		path.join(__dirname, `src/media/temporary_files/${filename}`),
		isAnimated ? 'stickerAnimated' : 'imageMessage',
		{ author: configuration.author, packname: configuration.packname }
	);

	return sticker;
};

const downloadAndSaveMediaMessage = async (client, data, filename, messageType) => {
	const savedPath = path.join(__dirname, `src/media/temporary_files/${filename}.${data.mimetype.split('/')[1]}`);

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
				name: 'Provided by Nanda, Void Bot. Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪'
			}
		},
		options
	);
	await client.send(from, { text: caption }, options);
};

export default deletedHandler;
