import { getContentType, getDevice, normalizeMessageContent } from 'baileys';
import fs from 'fs-extra';
import PhoneNumber from 'libphonenumber-js';

import { color, loggers } from '../../utils/modules/index.js';
import configuration from '../config/connect.js';
import { getBannedUsers } from '../database/adapters/user.js';
import prisma from '../database/prisma.js';
import { checkJSON, pushDefaultSettings, updateSettings } from '../groups/settings/index.js';
import {
	extractBody,
	extractMentionedJid,
	extractMetadata,
	extractQuotedBody,
	extractTypeQuoted,
	firstKey,
	NO_DATA,
	PollUpdateDecrypt,
	S_WHATSAPP_NET,
	typeMessage
} from '../misc/wa_data/index.js';
import { Cache } from './cache.js';

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
	const groupMetadata = await clients.instance.groupMetadata(id).catch(() => ({}));
	const partc = groupMetadata.participants;

	configuration.cache.metadata.set(id, {
		...groupMetadata,
		rawParticipants: partc || [],
		adminGroups: partc?.filter((v) => v.admin !== null)?.map((v) => v.phoneNumber),
		participantsGroup: partc?.map((v) => v.phoneNumber),
		ownerGroups: groupMetadata?.ownerPn || null
	});

	configuration.isFirstConnectionForCache = false;
};

const waitForInput = async (client, data) => {
	if (data.sendImpl) {
		await data.sendImpl();
	} else if (data.message) {
		await client.instance.send(data.from, { text: data.message });
	}

	return new Promise((resolve) => {
		const timeoutMs = (data.timeInSecond || 10) * 1000;

		const timer = setTimeout(() => {
			configuration.input.delete(data.sender);
			resolve({ timeout: true });
		}, timeoutMs);

		configuration.input.set(data.sender, {
			expectedType: data.expectedType,
			resolve(result) {
				clearTimeout(timer);
				configuration.input.delete(data.sender);
				resolve(result);
			}
		});
	});
};

const lidMaps = new Cache();

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
export const reassign = async (m, client, store, state) => {
	try {
		if (m.message?.protocolMessage?.type === 0) {
			return m;
		}

		delete m?.message?.senderKeyDistributionMessage;

		const isFromMe = m?.key?.fromMe;

		const from = m?.key?.remoteJidAlt || m?.key?.remoteJid || m?.from;
		const isGroup = from.endsWith('@g.us');
		let groupSettings;
		const isBaileys = m?.key?.id?.startsWith('BAE5') && m?.key?.id?.length === 16;
		const device = getDevice(m.key.id);
		const myJid = client.instance.decodeJid(instance);
		const sender = isFromMe
			? myJid
			: isGroup
				? m?.key?.participant?.endsWith('@lid')
					? m?.key?.participantAlt
					: m?.key?.participant
				: m?.key?.remoteJid === 'status@broadcast'
					? m?.key?.participant
					: m?.key?.remoteJidAlt || m?.key?.remoteJid || m?.from;

		const lid = isFromMe
			? state && state.creds.me?.lid?.endsWith('@lid')
				? client.instance.decodeJid(state.creds.me?.lid)
				: null
			: isGroup
				? m?.key?.participant?.endsWith('@lid')
					? m?.key?.participant
					: m?.key?.remoteJid?.endsWith('@lid')
						? m?.key?.remoteJid
						: null
				: null;

		if (lid && !lidMaps.has(lid) && lid.endsWith('@lid')) {
			lidMaps.set(lid, {
				pushName: isFromMe ? state.creds.me?.name : m.pushName,
				id: sender
			});
		}

		const isMetadata = configuration.cache.metadata?.has(from);
		const isUsers = configuration.cache.users.has(sender);
		const isSettings = configuration.cache.settings.has(from);

		if (m.message?.pollUpdateMessage) {
			client.instance.ev.emit('poll.update', { ...m.message, msg: m, from, sender, func: PollUpdateDecrypt });
		}

		if (configuration.isFirstConnectionForCache || !configuration.cache.prefixValues) {
			const SETTINGS = await fs.readJSON('./src/helper/config/settings.json');
			const dataBanned = await getBannedUsers(prisma);

			const botNumber = myJid;
			const dataBlock = await client.instance.fetchBlocklist();

			configuration.cache.bannedlist = dataBanned;
			configuration.cache.blocklist = dataBlock;

			const cliPrefixFlag = configuration.OPTIONS?.prefix || '';
			const cliPrefixes = cliPrefixFlag
				? cliPrefixFlag
						.split(',')
						.map((p) => p.trim())
						.filter(Boolean)
				: [];

			let prefixMode = 'single';
			let prefixValues = [];

			if (cliPrefixFlag) {
				if (SETTINGS.prefix.multi) {
					prefixMode = 'multi';
					const baseMultiChars = [...'°π÷×¶∆£¢€¥®™✓_=+|~!#$%^&./\\©^>'];

					prefixValues = [...new Set([...baseMultiChars, ...cliPrefixes])];
				} else {
					prefixMode = 'single';
					prefixValues = cliPrefixes.length > 1 ? cliPrefixes : cliPrefixes.length === 1 ? [cliPrefixes[0]] : [];
				}
			} else if (SETTINGS.prefix.multi && SETTINGS.prefix.nopref) {
				loggers.warning(
					color('Prefix mode conflict:', 'red'),
					color('multi and nopref cannot both be true in settings.json.', 'white'),
					color('Falling back to multi-prefix mode.', 'yellow')
				);

				prefixMode = 'multi';
				const baseConflict = [...'°π÷×¶∆£¢€¥®™✓_=+|~!#$%^&./\\©^>'];
				const customConflict = Array.isArray(SETTINGS.prefix.customPrefixes) ? SETTINGS.prefix.customPrefixes : [];

				prefixValues = customConflict.length ? [...new Set([...baseConflict, ...customConflict])] : baseConflict;
			} else if (SETTINGS.prefix.multi) {
				prefixMode = 'multi';
				const baseMultiChars = [...'°π÷×¶∆£¢€¥®™✓_=+|~!#$%^&./\\©^>'];
				const customPrefixes = Array.isArray(SETTINGS.prefix.customPrefixes) ? SETTINGS.prefix.customPrefixes : [];

				prefixValues = customPrefixes.length ? [...new Set([...baseMultiChars, ...customPrefixes])] : baseMultiChars;
			} else if (SETTINGS.prefix.nopref) {
				prefixMode = 'nopref';
				prefixValues = [];
			} else {
				prefixMode = 'single';
				prefixValues = [SETTINGS.prefix.pref || '.'];
			}

			const escCharClass = (str) => str.replace(/[[\]\\^$]/g, (m) => `\\${m}`);
			const escapedValues = prefixValues.map(escCharClass).join('');

			const prefixReg = prefixMode === 'multi' ? new RegExp(`^[${escapedValues}]`) : null;

			configuration.cache = {
				...configuration.cache,
				prf: prefixMode === 'nopref' ? '' : prefixValues[0] || '.',
				prefixMode,
				prefixReg,
				prefixValues,
				botNumber,
				ownerNumbers: [SETTINGS.owner_number, ...SETTINGS.team_number, botNumber]
			};

			configuration.cache.prefixConfig = {
				multi: prefixMode === 'multi',
				nopref: prefixMode === 'nopref',
				pref: prefixValues[0] || '.',
				cliPrefixes: cliPrefixes.length ? cliPrefixes : SETTINGS.prefix.customPrefixes || [],
				prefixValues
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
			const cachedUser = configuration.cache.users.get(sender);
			const prettyNumber =
				cachedUser?.prettyNumber || PhoneNumber(`+${sender?.replace(S_WHATSAPP_NET, '')}`)?.formatInternational() || 'No Data';

			configuration.cache.users.set(sender, {
				prettyNumber,
				name: m.pushName,
				ephemeralDuration: isGroup
					? store.messages[sender] && store.messages[sender].array.length
						? crawlProperty(store.messages[sender].array[0].message, 'expiration')
						: 0
					: crawlProperty(m.message, 'expiration')
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

		const { prettyNumber, name, ephemeralDuration } = configuration.cache.users.get(sender);
		const groupName = isGroup ? groupMetadata?.subject : NO_DATA;
		const groupDescription = isGroup ? groupMetadata?.desc?.toString() : NO_DATA;
		const groupId = isGroup ? groupMetadata?.id : NO_DATA;

		let ephemeralUser = null;

		if (isUsers && !isGroup) {
			ephemeralUser = crawlProperty(m.message, 'expiration');
		}

		if (isUsers && !isGroup && ephemeralDuration !== ephemeralUser) {
			configuration.cache.users.set(
				sender,
				Object.assign(configuration.cache.users.get(sender), { ephemeralDuration: ephemeralUser })
			);
		}

		if (isGroup) {
			if (!isSettings) {
				let settingsEntry = await checkJSON(from);

				if (typeof settingsEntry === 'boolean') {
					await pushDefaultSettings(from, groupName, groupDescription);
					settingsEntry = await checkJSON(from);
				}

				if (settingsEntry) {
					configuration.cache.settings.set(from, settingsEntry);
				}

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

		let content = null;
		const getContent = () => {
			if (content === null) {
				content = JSON.stringify(m?.message, null, 2);
			}

			return content;
		};
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
				groupMetadata,
				device
			};
		}

		m.message = Object.keys(m.message)[0] === 'ephemeralMessage' ? normalizeMessageContent(m) : m.message;
		let type = getContentType(m.message);

		type =
			type === 'extendedTextMessage' && m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length
				? (type = 'mentionText')
				: type;

		const { rawParticipants, adminGroups, participantsGroup, ownerGroups } = groupMetadata;
		const isAdmin = adminGroups?.includes(sender);
		const isBotAdmin = adminGroups?.includes(botNumber);
		const isDisappearingChat = m.message?.[type]?.contextInfo?.expiration !== 0;

		const body = extractBody(m, type);
		const args = body?.split(/ +/g);
		let cmd = body?.toLowerCase()?.split(' ')[0] || '';
		let { prf, prefixMode, prefixReg } = configuration.cache;

		if (prefixMode === 'multi' && prefixReg) {
			prf = prefixReg.test(cmd) ? cmd.match(prefixReg)?.[0] : null;
		} else if (prefixMode === 'nopref') {
			prf = '';
		}

		const isCmd = prefixMode === 'nopref' ? true : body != null && prf != null && body.startsWith(prf);

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
				isCmd,
				device
			};
		}

		const isMedia = ['videoMessage', 'imageMessage', 'documentMessage'].includes(type);
		const contentText = type === 'extendedTextMessage' ? getContent() : '';
		const isQuotedImage =
			type === 'extendedTextMessage' && !contentText.includes('viewOnceMessage') && contentText.includes('imageMessage');
		const isQuotedVideo =
			type === 'extendedTextMessage' && !contentText.includes('viewOnceMessage') && contentText.includes('videoMessage');
		const isQuotedSticker = type === 'extendedTextMessage' && contentText.includes('stickerMessage');
		const isQuotedAudio = type === 'extendedTextMessage' && contentText.includes('audioMessage');
		const isQuotedDocument =
			type === 'extendedTextMessage' &&
			(contentText.includes('documentMessage') || contentText.includes('documentWithCaptionMessage'));
		const isQuotedContact = type === 'extendedTextMessage' && contentText.includes('contactMessage');
		const isQuotedLocation = type === 'extendedTextMessage' && contentText.includes('locationMessage');
		const isQuotedLiveLocation = type === 'extendedTextMessage' && contentText.includes('liveLocationMessage');
		const isQuotedContactsArray = type === 'extendedTextMessage' && contentText.includes('contactsArrayMessage');

		const typeQuoted = extractTypeQuoted(m, type);

		const isMediaVid = type === 'videoMessage' || isQuotedVideo;
		const isMediaImage = type === 'imageMessage' || isQuotedImage;
		const isMediaDocument = type === 'documentMessage' || type === 'documentWithCaptionMessage' || isQuotedDocument;
		const isSticker = type === 'stickerMessage';
		const isAudio = type === 'audioMessage';
		const isContact = type === 'contactMessage';
		const isContactsArray = type === 'contactsArrayMessage';
		const isDocument = type === 'documentMessage' || type === 'documentWithCaptionMessage';
		const isViewOnce = type === 'viewOnceMessage';
		const isLocation = type === 'locationMessage';
		const isLiveLocation = type === 'liveLocationMessage';

		const viewOnceMessage = isViewOnce && normalizeMessageContent(m.message);

		const isViewOnceImage = viewOnceMessage.imageMessage ? true : false;
		const isViewOnceVideo = viewOnceMessage.videoMessage ? true : false;
		const isQuotedViewOnce = type === 'extendedTextMessage' && contentText.includes('viewOnceMessage');
		const isQuotedViewOnceImage =
			isQuotedViewOnce && contentText.includes('viewOnceMessage') && contentText.includes('imageMessage');
		const isQuotedViewOnceVideo =
			isQuotedViewOnce && contentText.includes('viewOnceMessage') && contentText.includes('videoMessage');
		const typeViewOnce = Object.keys(viewOnceMessage)?.[0];

		const mMediaData =
			type === 'extendedTextMessage'
				? JSON.parse(JSON.stringify(m).replace('quotedM', 'm'))?.message?.extendedTextMessage?.contextInfo
				: m;

		const mediaData =
			type === 'extendedTextMessage' || type === 'mentionText'
				? typeQuoted === 'thumbnailMessage'
					? m
					: { ...mMediaData, ...lidMaps.get(mMediaData?.participant) } || {}
				: m || {};

		mediaData.extract = () => {
			const messages = store.loadMessage(from, mediaData.stanzaId);

			messages.parse = async () => reassign(messages, client, store);

			return messages;
		};

		const bodyQuoted = typeMessage.includes(
			type === 'extendedTextMessage' && mMediaData ? firstKey(mMediaData.message || { CLIENT: 'm' }) : 'none'
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
			participantsGroup,
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
			isMediaDocument,
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
			waitForInput,
			device,
			prefixInfo: configuration.cache.prefixConfig
		};
	} catch (e) {
		log(e);
		return {
			error: e
		};
	}
};
