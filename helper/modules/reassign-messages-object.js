/* global botNum, log */

import { getContentType, normalizeMessageContent } from '@adiwajshing/baileys';
import PhoneNumber from 'awesome-phonenumber';

import configuration from '../../connect.js';
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
} from '../misc/wa_data/index.js';
import { readJSON } from './index.js';

const typeSticker = ['imageMessage', 'videoMessage', 'stickerMessage'];

const caching = async (clients, id) => {
	await new Promise(async (resolve) => {
		const groupMetadata = (await clients[botNum].groupMetadata(id).catch(() => undefined)) || {};
		const partc = groupMetadata.participants;

		configuration.cache.metadata.set(id, {
			...groupMetadata,
			rawParticipants: partc || [],
			adminGroups: partc?.filter((v) => v.admin !== null)?.map((v) => v.id),
			participantsGroups: partc?.map((v) => v.id),
			ownerGroups: partc?.find((v) => v.admin === 'superadmin')?.id || null,
		});
		resolve();
	});

	configuration.isFirstConnection = false;
};

/**
 *
 * @param {*} m
 * @param {*} client
 * @param {*} store
 * @returns {Promise<{message: any, isFromMe: boolean, from: string, isGroup: boolean, isBaileys: boolean, isDisappearingChat: boolean, sender: string, prettyNumber: string, timeStamp: number, filename: string, groupMetadata: string, ...groupSettings: any, groupName: string, groupId: string, isGroupOwner: boolean, pushname: string, botNumber: string, ownerNumbers: string[], isOwner: boolean, settings: any, type: string, typeQuoted: string, typeSticker: string, stickerAble: boolean, isAdmin: boolean | undefined, rawParticipants: object[] | undefined, adminGroups: string[] | undefined, participantsGroups: string[] | undefined, ownerGroups: string | undefined, isBotAdmin: boolean | undefined, body: string, args: string[] | undefined, cmd: string, isCmd: boolean, prefix: string, query: string | undefined, isMedia: boolean, isQuotedImage: boolean, isQuotedVideo: boolean, isQuotedAudio: boolean, isQuotedContact: boolean, isQuotedContactsArray: boolean, isQuotedDocument: boolean, isQuotedLiveLocation: boolean, isQuotedLocation: boolean, isQuotedSticker: boolean, isMediaVid: boolean, isMediaImage: boolean, isSticker: boolean, isAudio: boolean, isContact: boolean, isContactsArray: boolean, isDocument: boolean, isLocation: boolean, isLiveLocation: boolean, isViewOnce: boolean, isViewOnceImage: boolean, isViewOnceVideo: boolean, isQuotedViewOnce: boolean, isQuotedViewOnceImage: boolean, isQuotedViewOnceVideo: boolean, typeViewOnce: string, mention: string[], mediaData: any, extractMediaData: any, bodyQuoted: string}>}
 */
export const reassign = async (m, client, store) => {
	try {
		if (m.message?.protocolMessage && m.message.protocolMessage.type === 'REVOKE') {
			return m;
		}

		delete m?.message?.messageContextInfo;
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

		if (configuration.isFirstConnection) {
			const SETTINGS = readJSON('./config/settings.json');
			const dataBanned = readJSON('./databases/users/banned.json');

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
				ownerNumbers: [SETTINGS.owner_number, ...SETTINGS.team_number, botNumber],
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
			});
		}

		const { prettyNumber, name } = configuration.cache.users.get(sender);
		const groupName = isGroup ? groupMetadata?.subject : NO_DATA;
		const groupDescription = isGroup ? groupMetadata?.desc?.toString() : NO_DATA;
		const groupId = isGroup ? groupMetadata?.id : NO_DATA;

		if (isGroup) {
			if (!isSettings || typeof checkJSON(from) === 'boolean') {
				if (typeof checkJSON(from) === 'boolean') {
					pushDefaultSettings(from, groupName, groupDescription);
				}

				configuration.cache.settings.set(from, checkJSON(from));
				groupSettings = configuration.cache.settings.get(from);
			} else if ('GROUP_CHANGE_SUBJECT' === m.messageStubType) {
				groupSettings = configuration.cache.settings.get(from);
				updateSettings('groupName', m.messageStubParameters[0], from);
			} else if ('GROUP_CHANGE_DESCRIPTION' === m.messageStubType) {
				groupSettings = configuration.cache.settings.get(from);
				updateSettings('groupDescription', m.content, from);
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
				isCmd,
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
				: 'none',
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
			bodyQuoted,
		};
	} catch (e) {
		log(e);
		return {
			error: e,
		};
	}
};
