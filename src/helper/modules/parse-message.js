import { getContentType, normalizeMessageContent } from '@adiwajshing/baileys';
import PhoneNumber from 'libphonenumber-js';
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
 * @param {AdvancedClient} clients
 * @param {string} id
 */
const caching = async (clients, id) => {
	await new Promise(async (resolve) => {
		const groupMetadata = await clients.instance.groupMetadata(id).catch(() => ({}));
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

const waitForInput = (client, data) =>
	new Promise(async (resolve) => {
		if (data.message) {
			await client.instance.send(data.from, {
				text: data.message
			});
		}

		let times = Date.now();

		configuration.input.set(data.sender, {
			timeout: setInterval(() => {
				const sender = data.sender;
				const { timeout, message, quoted, invalid } = configuration.input.get(sender);

				if (message !== '') {
					clearInterval(timeout);
					configuration.input.delete(sender);
					resolve({ message, quoted, invalid });
				}

				if (Date.now() - times > (data.timeInSecond || 10) * 1000) {
					clearInterval(timeout);
					configuration.input.delete(sender);
					resolve({ timeout: true });
				}
			}, 1000),
			expectedType: data.expectedType,
			message: '',
			quoted: null,
			invalid: false
		});
	});

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
 * Reassigns and normalizes message data for easier handling and access.
 * @type {import('../../types/Reconstruct/index.js').Reconstructuring}
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
			(m?.key?.id?.startsWith('BAE5') && m?.key?.id?.length === 16) || (isFromMe && m?.key?.id?.startsWith('HFINDER'));
		const sender = isFromMe
			? `${client.instance.user.id.split(':')[0]}${S_WHATSAPP_NET}`
			: isGroup
			? m?.key?.participant
			: m?.key?.remoteJid;

		const isMetadata = configuration.cache.metadata?.has(from);
		const isUsers = configuration.cache.users.has(sender);
		const isSettings = configuration.cache.settings.has(from);

		if (m.message?.pollUpdateMessage) {
			client.instance.ev.emit('poll.update', { ...m.message, msg: m, from, sender, func: PollUpdateDecrypt });
		}

		if (configuration.isFirstConnection) {
			const SETTINGS = await fs.readJSON('./src/helper/config/settings.json');
			const dataBanned = await fs.readJSON('./databases/users/banned.json');

			const { multi, noPref } = SETTINGS.prefix;
			const botNumber = `${client.instance.user.id.split(':')[0]}${S_WHATSAPP_NET}`;

			const dataBlock = await client.instance.fetchBlocklist();

			configuration.cache.bannedlist = dataBanned;
			configuration.cache.blocklist = dataBlock;

			const prefixMode = multi ? 'multi_prefix' : noPref ? 'no_prefix' : SETTINGS.prefix.pref || '.';

			const prf =
				prefixMode === 'multi_prefix' ? /^[°π÷×¶∆£¢€¥®™✓_=+|~!#$%^&./\\©^>]/ : prefixMode === 'no_prefix' ? '' : prefixMode;

			configuration.cache = {
				...configuration.cache,
				prf,
				prefixMode,
				prefixReg: /^[°π÷×¶∆£¢€¥®™✓_=+|~!#$%^&./\\©^>]/,
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
				prettyNumber: PhoneNumber(`+${sender?.replace(S_WHATSAPP_NET, '')}`)?.formatInternational() ?? 'No Data',
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
		let cmd = body?.toLowerCase()?.split(' ')[0] || '';
		let { prf, prefixMode, prefixReg } = configuration.cache;

		if (prefixMode === 'multi_prefix') {
			prf = prefixReg.test(cmd) ? cmd.match(new RegExp(prefixReg, 'gi')) : '-';
		}

		const isCmd = body?.startsWith(prf);

		cmd = isCmd ? cmd : '';
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

		mediaData.extract = () => store.loadMessage(from, mediaData.stanzaId);

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
			bodyQuoted,
			waitForInput
		};
	} catch (e) {
		log(e);
		return {
			error: e
		};
	}
};
