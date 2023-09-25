import { getContentType, normalizeMessageContent } from '@adiwajshing/baileys';
import PhoneNumber from 'awesome-phonenumber';
import fs from 'fs-extra';

import configuration from '../config/connect.js';
import { checkJSON, pushDefaultSettings, updateSettings } from '../groups/settings/index.js';
import {
	NO_DATA,
	extractBody,
	extractTypeQuoted,
	extractQuotedBody,
	typeMessage,
	extractMentionedJid,
	extractMetadata,
	S_WHATSAPP_NET,
	PollUpdateDecrypt
} from '../misc/wa_data/index.js';

/**
 * @constant
 * @type {Array.<'imageMessage' | 'videoMessage' | 'stickerMessage'>}
 */
const typeSticker = ['imageMessage', 'videoMessage', 'stickerMessage'];

/**
 * @typedef {import('@adiwajshing/baileys').GroupParticipant[]} GroupMetadataParticipants
 * @typedef {import('@adiwajshing/baileys').GroupMetadata} GroupMetadata
 */

/**
 * @typedef {object} GroupMetadataParsed
 * @property {GroupMetadataParticipants} rawParticipants
 * @property {string[]} adminGroups
 * @property {string[]} participantsGroups
 * @property {string} ownerGroups
 */

/**
 *
 * @param {typeof client} clients
 * @param {string} id
 */
const caching = async (clients, id) => {
	await new Promise(async (resolve) => {
		const groupMetadata = await clients[botNum].groupMetadata(id).catch(() => ({}));
		const partc = groupMetadata.participants;

		configuration.cache.metadata.set(id, {
			...groupMetadata,
			rawParticipants: partc || [],
			adminGroups: partc?.filter((v) => v.admin !== null)?.map((v) => v.id),
			participantsGroups: partc?.map((v) => v.id),
			ownerGroups: partc?.find((v) => v.admin === 'superadmin')?.id || null
		});
		resolve();
	});

	configuration.isFirstConnection = false;
};

/**
 *
 * @param {Object} obj
 * @param {string} propName
 * @returns
 */
function crawlProperty(obj, propName) {
	for (let key in obj) {
		if (key === propName) {
			return obj[key];
		} else if (typeof obj[key] === 'object') {
			const foundProp = crawlProperty(obj[key], propName);

			if (foundProp !== undefined) {
				return foundProp;
			}
		}
	}
}

/**
 * @typedef {import('@adiwajshing/baileys').proto.WebMessageInfo} Message
 */
/**
 * @typedef {object} ReassignResult
 * @property {Message} message - The reassigned message object.
 * @property {boolean} isFromMe - Indicates if the message is from the current user.
 * @property {string} from - The sender's JID.
 * @property {boolean} isGroup - Indicates if the message is from a group.
 * @property {boolean} isBaileys - Indicates if the message is a Baileys protocol message.
 * @property {boolean} isDisappearingChat - Indicates if the message is from a disappearing chat.
 * @property {string} sender - The sender's JID.
 * @property {string} prettyNumber - The sender's pretty formatted phone number.
 * @property {number} timeStamp - The timestamp of the message.
 * @property {string} filename - The filename associated with the message.
 * @property {GroupMetadataParsed & GroupMetadata} groupMetadata - Group metadata information.
 * @property {...object} groupSettings - Additional group settings.
 * @property {string} groupName - The name of the group.
 * @property {string} groupId - The ID of the group.
 * @property {boolean} isGroupOwner - Indicates if the sender is the group owner.
 * @property {string} pushname - The pushname of the sender.
 * @property {string} botNumber - The phone number of the bot.
 * @property {string[]} ownerNumbers - Array of owner phone numbers.
 * @property {boolean} isOwner - Indicates if the sender is an owner.
 * @property {any} settings - Additional settings data.
 * @property {string} type - The type of message.
 * @property {string} typeQuoted - The type of the quoted message, if any.
 * @property {typeof typeSticker} typeSticker - The type of sticker message.
 * @property {boolean} stickerAble - Indicates if stickers can be sent.
 * @property {boolean | undefined} isAdmin - Indicates if the sender is an admin.
 * @property {object[] | undefined} rawParticipants - Array of raw participants data.
 * @property {string[] | undefined} adminGroups - Array of admin group IDs.
 * @property {string[] | undefined} participantsGroups - Array of group IDs with participants.
 * @property {string | undefined} ownerGroups - The group ID where the sender is the owner.
 * @property {boolean | undefined} isBotAdmin - Indicates if the bot is an admin in the group.
 * @property {string} body - The message body.
 * @property {string[] | undefined} args - Array of command arguments.
 * @property {string} cmd - The command.
 * @property {boolean} isCmd - Indicates if the message is a command.
 * @property {string} prefix - The command prefix.
 * @property {string | undefined} query - The command query.
 * @property {boolean} isMedia - Indicates if the message is media (e.g., image, video).
 * @property {boolean} isQuotedImage - Indicates if the message quotes an image.
 * @property {boolean} isQuotedVideo - Indicates if the message quotes a video.
 * @property {boolean} isQuotedAudio - Indicates if the message quotes audio.
 * @property {boolean} isQuotedContact - Indicates if the message quotes a contact.
 * @property {boolean} isQuotedContactsArray - Indicates if the message quotes a contacts array.
 * @property {boolean} isQuotedDocument - Indicates if the message quotes a document.
 * @property {boolean} isQuotedLiveLocation - Indicates if the message quotes live location.
 * @property {boolean} isQuotedLocation - Indicates if the message quotes location.
 * @property {boolean} isQuotedSticker - Indicates if the message quotes a sticker.
 * @property {boolean} isMediaVid - Indicates if the message is a video or quotes a video.
 * @property {boolean} isMediaImage - Indicates if the message is an image or quotes an image.
 * @property {boolean} isSticker - Indicates if the message is a sticker.
 * @property {boolean} isAudio - Indicates if the message is audio.
 * @property {boolean} isContact - Indicates if the message is a contact.
 * @property {boolean} isContactsArray - Indicates if the message is a contacts array.
 * @property {boolean} isDocument - Indicates if the message is a document.
 * @property {boolean} isLocation - Indicates if the message is a location.
 * @property {boolean} isLiveLocation - Indicates if the message is live location.
 * @property {boolean} isViewOnce - Indicates if the message is a view-once message.
 * @property {boolean} isViewOnceImage - Indicates if the message is a view-once image.
 * @property {boolean} isViewOnceVideo - Indicates if the message is a view-once video.
 * @property {boolean} isQuotedViewOnce - Indicates if the message quotes a view-once message.
 * @property {boolean} isQuotedViewOnceImage - Indicates if the message quotes a view-once image.
 * @property {boolean} isQuotedViewOnceVideo - Indicates if the message quotes a view-once video.
 * @property {string} typeViewOnce - The type of the view-once message.
 * @property {string[]} mention - Array of mentioned JIDs.
 * @property {import('@adiwajshing/baileys').WAMessageContent} mediaData - Media data associated with the message.
 * @property {import('@adiwajshing/baileys').WAGenericMediaMessage} extractMediaData - Extracted media data.
 * @property {string} bodyQuoted - The quoted message body.
 */

/**
 * Reassigns and normalizes message data for easier handling and access.
 *
 * @param {import('@adiwajshing/baileys').proto.IWebMessageInfo} m - The original message object.
 * @param {typeof client} client - The client object.
 * @param {import('../connection/type.js').Store} store - The store object.
 * @returns {Promise<ReassignResult>} - The reassigned message data or an error object.
 */
export const reassign = async (m, client, store) => {
	try {
		if (m.message?.protocolMessage?.type === 0) {
			return m;
		}

		delete m?.message?.senderKeyDistributionMessage;

		const isFromMe = m?.key?.fromMe;
		const from = m?.key?.remoteJid || m?.from;
		const isGroup = from.endsWith('@g.us');
		let groupSettings;
		const isBaileys =
			(m?.key?.id?.startsWith('BAE5') && m?.key?.id?.length === 16) || (isFromMe && m?.key?.id?.startsWith('VOID'));
		const sender = isFromMe
			? `${client[botNum].user.id.split(':')[0]}${S_WHATSAPP_NET}`
			: isGroup
			? m?.key?.participant
			: m?.key?.remoteJid;

		const isMetadata = configuration.cache.metadata?.has(from);
		const isUsers = configuration.cache.users.has(sender);
		const isSettings = configuration.cache.settings.has(from);

		if (m.message?.pollUpdateMessage) {
			client[botNum].ev.emit('poll.update', { ...m.message, msg: m, from, sender, func: PollUpdateDecrypt });
		}

		if (configuration.isFirstConnection) {
			const SETTINGS = await fs.readJSON('./src/helper/config/settings.json');
			const dataBanned = await fs.readJSON('./databases/users/banned.json');

			const { multi, noPref } = SETTINGS.prefix;
			const botNumber = `${client[botNum].user.id.split(':')[0]}${S_WHATSAPP_NET}`;

			const dataBlock = await client[botNum].fetchBlocklist();

			configuration.cache.bannedlist = dataBanned;
			configuration.cache.blocklist = dataBlock;

			configuration.cache = {
				...configuration.cache,
				multi,
				noPref,
				pref: SETTINGS.prefix.pref || '.',
				botNumber,
				ownerNumbers: [SETTINGS.owner_number, ...SETTINGS.team_number, botNumber]
			};

			configuration.cache.config = SETTINGS;
		}

		if (!isMetadata && isGroup) {
			await caching(client, from);
		}

		const SETTINGS = configuration.cache.config;
		const { blocklist, bannedlist } = configuration.cache;
		const isBlocked = blocklist?.includes(sender);
		const isBanned = bannedlist?.includes(sender);
		const groupMetadata = isGroup ? configuration.cache.metadata.get(from) : {};
		const isGroupOwner = isGroup ? groupMetadata?.owner === sender : false;

		if (!isUsers) {
			configuration.cache.users.set(sender, {
				prettyNumber:
					PhoneNumber(`+${sender?.replace(S_WHATSAPP_NET, '')}`)?.getNumber('international') ??
					PhoneNumber(`+${m?.key?.participant?.replace(S_WHATSAPP_NET, '')}`)?.getNumber('international') ??
					'No Data',
				ephemeralDuration: crawlProperty(m.message, 'expiration')
			});
		}

		if (m.message?.protocolMessage?.type === 3) {
			const keyStats = isMetadata && isGroup ? 'metadata' : isUsers && !isGroup ? 'users' : '';

			if (keyStats) {
				const val = configuration.cache[keyStats].get(from);

				val.ephemeralDuration = m.message.protocolMessage.ephemeralExpiration || null;
				configuration.cache[keyStats].set(from, val);
			}
		}

		const { prettyNumber, name } = configuration.cache.users.get(sender);
		const groupName = isGroup ? groupMetadata?.subject : NO_DATA;
		const groupDescription = isGroup ? groupMetadata?.desc?.toString() : NO_DATA;
		const groupId = isGroup ? groupMetadata?.id : NO_DATA;

		if (isGroup) {
			if (!isSettings || typeof (await checkJSON(from)) === 'boolean') {
				if (typeof (await checkJSON(from)) === 'boolean') {
					await pushDefaultSettings(from, groupName, groupDescription);
				}

				configuration.cache.settings.set(from, await checkJSON(from));
				groupSettings = configuration.cache.settings.get(from);
			} else if ('GROUP_CHANGE_SUBJECT' === m.messageStubType) {
				groupSettings = configuration.cache.settings.get(from);
				await updateSettings('groupName', m.messageStubParameters[0], from);
			} else if ('GROUP_CHANGE_DESCRIPTION' === m.messageStubType) {
				groupSettings = configuration.cache.settings.get(from);
				await updateSettings('groupDescription', m.content, from);
			} else {
				groupSettings = configuration.cache.settings.get(from);
			}
		}

		const content = JSON.stringify(m?.message, null, 2);
		const pushname = m?.pushName
			? m?.pushName?.trim()
			: name || store?.contacts?.[sender]?.verifiedName || store?.contacts?.[sender]?.notify || prettyNumber;
		const { botNumber, ownerNumbers } = configuration.cache;
		const isOwner = ownerNumbers.includes(sender);
		const timeStamp = m?.messageTimestamp || Date.now();
		const filename = sender + (m?.key?.id || Date.now());

		if (!m.message) {
			return {
				...m,
				settings: SETTINGS,
				isFromMe,
				from,
				isGroup,
				...groupSettings,
				isBaileys,
				sender,
				isBlocked,
				prettyNumber,
				groupName,
				groupId,
				isGroupOwner,
				pushname,
				botNumber,
				isOwner,
				timeStamp,
				filename,
				groupMetadata
			};
		}

		m.message = Object.keys(m.message)[0] === 'ephemeralMessage' ? normalizeMessageContent(m) : m.message;
		let type = getContentType(m.message);

		type =
			type === 'extendedTextMessage' && m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0
				? (type = 'mentionText')
				: type;

		const { rawParticipants, adminGroups, participantsGroups, ownerGroups } = groupMetadata;
		const isAdmin = adminGroups?.includes(sender);
		const isBotAdmin = adminGroups?.includes(botNumber);
		const isDisappearingChat = m.message?.[type]?.contextInfo?.expiration !== 0;

		const body = extractBody(m, type);
		const args = body?.split(/ +/g);
		const cmd = body?.toLowerCase()?.split(' ')[0] || '';
		const { multi, noPref, pref } = configuration.cache;

		let prf;

		if (multi) {
			prf = /^[°π÷×¶∆£¢€¥®™✓_=+|~!#$%^&./\\©^>]/.test(cmd) ? cmd.match(/^[°π÷×¶∆£¢€¥®™✓_=+|~!#$%^&./\\©^>]/gi) : '-';
		} else if (noPref) {
			prf = '';
		} else {
			prf = pref;
		}

		const isCmd = body?.startsWith(prf);
		const query = args?.slice(1)?.join(' ');

		if (isBlocked || isBanned) {
			return {
				pushname,
				prettyNumber,
				from,
				body,
				cmd,
				args,
				query,
				isGroup,
				prefix: prf,
				message: m,
				isBaileys,
				type,
				isBlocked,
				isBanned,
				isCmd
			};
		}

		const isMedia = ['videoMessage', 'imageMessage'].includes(type);
		const isQuotedImage =
			type === 'extendedTextMessage' && !content.includes('viewOnceMessage') && content.includes('imageMessage');
		const isQuotedVideo =
			type === 'extendedTextMessage' && !content.includes('viewOnceMessage') && content.includes('videoMessage');
		const isQuotedSticker = type === 'extendedTextMessage' && content.includes('stickerMessage');
		const isQuotedAudio = type === 'extendedTextMessage' && content.includes('audioMessage');
		const isQuotedDocument = type === 'extendedTextMessage' && content.includes('documentMessage');
		const isQuotedContact = type === 'extendedTextMessage' && content.includes('contactMessage');
		const isQuotedLocation = type === 'extendedTextMessage' && content.includes('locationMessage');
		const isQuotedLiveLocation = type === 'extendedTextMessage' && content.includes('liveLocationMessage');
		const isQuotedContactsArray = type === 'extendedTextMessage' && content.includes('contactsArrayMessage');

		const typeQuoted = extractTypeQuoted(m, type);

		const isMediaVid = type === 'videoMessage' || isQuotedVideo;
		const isMediaImage = type === 'imageMessage' || isQuotedImage;
		const isSticker = type === 'stickerMessage';
		const isAudio = type === 'audioMessage';
		const isContact = type === 'contactMessage';
		const isContactsArray = type === 'contactsArrayMessage';
		const isDocument = type === 'documentMessage';
		const isViewOnce = type === 'viewOnceMessage';
		const isLocation = type === 'locationMessage';
		const isLiveLocation = type === 'liveLocationMessage';

		const viewOnceMessage = isViewOnce && normalizeMessageContent(m.message);

		const isViewOnceImage = viewOnceMessage.imageMessage ? true : false;
		const isViewOnceVideo = viewOnceMessage.videoMessage ? true : false;
		const isQuotedViewOnce = type === 'extendedTextMessage' && content.includes('viewOnceMessage');
		const isQuotedViewOnceImage = isQuotedViewOnce && content.includes('viewOnceMessage') && content.includes('imageMessage');
		const isQuotedViewOnceVideo = isQuotedViewOnce && content.includes('viewOnceMessage') && content.includes('videoMessage');
		const typeViewOnce = Object.keys(viewOnceMessage)?.[0];

		const mMediaData =
			type === 'extendedTextMessage'
				? JSON.parse(JSON.stringify(m).replace('quotedM', 'm'))?.message?.extendedTextMessage?.contextInfo
				: m;

		const mediaData =
			type === 'extendedTextMessage' || type === 'mentionText'
				? typeQuoted === 'thumbnailMessage'
					? m
					: mMediaData || {}
				: m || {};

		const bodyQuoted = typeMessage.includes(
			type === 'extendedTextMessage' && mMediaData
				? Object.keys(mMediaData.message ? mMediaData.message : { CLIENT: 'm' })[0]
				: 'none'
		)
			? extractQuotedBody(mMediaData, typeQuoted)
			: '';

		const mention = extractMentionedJid(m, type);

		const extractMediaData = extractMetadata(mediaData, type, typeQuoted);

		const stickerAble = typeSticker.includes(typeQuoted);

		return {
			message: m,
			isFromMe,
			from,
			isGroup,
			isBaileys,
			isDisappearingChat,
			sender,
			prettyNumber,
			timeStamp,
			filename,
			groupMetadata,
			...groupSettings,
			groupName,
			groupId,
			isGroupOwner,
			pushname,
			botNumber,
			ownerNumbers,
			isOwner,
			settings: SETTINGS,
			type,
			typeQuoted,
			typeSticker,
			stickerAble,
			isAdmin,
			rawParticipants,
			adminGroups,
			participantsGroups,
			ownerGroups,
			isBotAdmin,
			body,
			args,
			cmd,
			isCmd,
			prefix: prf,
			query,
			isMedia,
			isQuotedImage,
			isQuotedVideo,
			isQuotedAudio,
			isQuotedContact,
			isQuotedContactsArray,
			isQuotedDocument,
			isQuotedLiveLocation,
			isQuotedLocation,
			isQuotedSticker,
			isMediaVid,
			isMediaImage,
			isSticker,
			isAudio,
			isContact,
			isContactsArray,
			isDocument,
			isLocation,
			isLiveLocation,
			isViewOnce,
			isViewOnceImage,
			isViewOnceVideo,
			isQuotedViewOnce,
			isQuotedViewOnceImage,
			isQuotedViewOnceVideo,
			typeViewOnce,
			mention,
			mediaData,
			extractMediaData,
			bodyQuoted
		};
	} catch (e) {
		log(e);
		return {
			error: e
		};
	}
};
