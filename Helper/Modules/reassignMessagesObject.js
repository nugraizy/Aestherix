import { getContentType } from "@adiwajshing/baileys";
import PhoneNumber from "awesome-phonenumber";
import moment from "moment-timezone";
import { checkJSON, pushDefaultSettings, updateSettings } from "../Groups/Settings/index.js";
import { NO_DATA } from "../Misc/WAData/index.js";
import { isEmpty, isNotNull, isNotSame, isSame, isUndefined, readJSON } from "./index.js";

moment.tz.setDefault("Asia/Jakarta").locale("id");
export const reassign = async (m, client, store) => {
	try {
		if (m.message?.protocolMessage && m.message.protocolMessage.type == "REVOKE") {
			return m;
		}
		delete m?.message?.messageContextInfo;
		delete m?.message?.senderKeyDistributionMessage;
		const isFromMe = m?.key?.fromMe;
		const from = m?.key?.remoteJid || m.from;
		const isGroup = from.endsWith("@g.us");
		let groupSettings;
		const isBaileys = (m?.key?.id?.startsWith("BAE5") && isSame(m?.key?.id?.length, 16)) || (isFromMe && m?.key?.id?.startsWith("VOID"));
		const sender = isFromMe ? `${client[botNum].user.id.split(":")[0]}@s.whatsapp.net` : isGroup ? m?.key?.participant : m?.key?.remoteJid;
		if (isFirstConnection) {
			const SETTINGS = readJSON("./Config/settings.json");
			const { multi, noPref } = SETTINGS.prefix;
			const botNumber = `${client[botNum].user.id.split(":")[0]}@s.whatsapp.net`;
			cache = {
				...cache,
				multi,
				noPref,
				pref: SETTINGS.prefix.pref || ".",
				botNumber,
				ownerNumbers: [SETTINGS.owner_number, ...SETTINGS.team_number, botNumber],
			};
			cache.config = SETTINGS;
		}
		if (!cache.metadata?.has(from) && isGroup) {
			await caching(client, from);
		}
		const SETTINGS = cache.config;
		const { blocklist, bannedlist } = cache;
		const isBlocked = blocklist?.includes(sender);
		const isBanned = bannedlist?.includes(sender);
		const groupMetadata = isGroup ? cache.metadata.get(from) : {};
		const isGroupOwner = isGroup ? (isSame(groupMetadata?.owner, sender) ? true : false) : false;
		if (!cache.users.has(sender)) {
			cache.users.set(sender, {
				prettyNumber:
					PhoneNumber(`+${sender?.replace("@s.whatsapp.net", "")}`)?.getNumber("international") ??
					PhoneNumber(`+${m?.key?.participant?.replace("@s.whatsapp.net", "")}`)?.getNumber("international") ??
					"No Data",
			});
		}
		const prettyNumber = cache.users.get(sender)?.prettyNumber;
		const groupName = isGroup ? groupMetadata?.subject : NO_DATA;
		const groupDescription = isGroup ? groupMetadata?.desc?.toString() : NO_DATA;
		const groupId = isGroup ? groupMetadata?.id : NO_DATA;
		if (isGroup) {
			if (!cache.settings.has(from) || typeof checkJSON(from) == "boolean") {
				if (typeof checkJSON(from) == "boolean") {
					pushDefaultSettings(from, groupName, groupDescription);
				}
				cache.settings.set(from, checkJSON(from));
				groupSettings = cache.settings.get(from);
			} else if ("GROUP_CHANGE_SUBJECT" == m.messageStubType) {
				groupSettings = cache.settings.get(from);
				updateSettings("groupName", m.messageStubParameters[0], from);
			} else if ("GROUP_CHANGE_DESCRIPTION" == m.messageStubType) {
				groupSettings = cache.settings.get(from);
				updateSettings("groupDescription", m.content, from);
			} else {
				groupSettings = cache.settings.get(from);
			}
		}
		const content = JSON.stringify(m?.message, null, 2);
		const pushname = m?.pushName
			? m?.pushName?.trim()
			: cache?.users?.get(sender)?.name || store?.contacts?.[sender]?.verifiedName || store?.contacts?.[sender]?.notify || prettyNumber;
		const { botNumber, ownerNumbers } = cache;
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
		m.message = isSame(Object.keys(m.message)[0], "ephemeralMessage") ? m.message.ephemeralMessage.message : m.message;
		let type = getContentType(m.message);
		type = isSame(type, "messageContextInfo") ? (type = Object.keys(m.message)[1]) : type;
		type = isSame(type, "extendedTextMessage") && m.message?.extendedTextMessage?.text?.includes("@") ? (type = "mentionText") : type;
		let mText = m;
		if (isSame(type, "ephemeralMessage")) {
			type = Object.keys(m.message?.ephemeralMessage?.message);
			mText = m.message.ephemeralMessage;
		}
		const { rawParticipants, adminGroups, participantsGroups, ownerGroups } = groupMetadata;
		const isAdmin = adminGroups?.includes(sender);
		const isBotAdmin = adminGroups?.includes(botNumber);
		const isDisappearingChat = m.message?.[type]?.contextInfo?.expiration !== 0;
		const body = isSame(type, "conversation")
			? mText.message.conversation
			: isSame(type, "mentionText")
			? mText.message.extendedTextMessage.text
			: isSame(type, "extendedTextMessage")
			? mText.message.extendedTextMessage.text
			: isSame(type, "stickerMessage")
			? "Sticker Message"
			: isSame(type, "audioMessage")
			? "Audio Message"
			: isSame(type, "documentMessage")
			? "Document Message"
			: isSame(type, "contactMessage")
			? "Contact Message"
			: isSame(type, "contactsArrayMessage")
			? "Contact ArrayMessage"
			: isSame(type, "listMessage")
			? "List Message"
			: isSame(type, "listResponseMessage")
			? mText.message.listResponseMessage.singleSelectReply.selectedRowId
			: isSame(type, "liveLocationMessage")
			? "Live Location Message"
			: isSame(type, "groupInviteMessage")
			? "Invitation Message"
			: isSame(type, "locationMessage")
			? "Location Message"
			: isSame(type, "orderMessage")
			? "Ordered Message"
			: isSame(type, "productMessage")
			? "Product Message"
			: isSame(type, "templateMessage")
			? "Template Message"
			: isSame(type, "templateButtonReplyMessage") && mText.message.templateButtonReplyMessage
			? mText.message.templateButtonReplyMessage.selectedId
			: isSame(type, "buttonsMessage")
			? mText.message.buttonsMessage.contentText
			: isSame(type, "buttonsResponseMessage")
			? mText.message.buttonsResponseMessage.selectedButtonId
			: isSame(type, "imageMessage")
			? mText.message.imageMessage.caption || "No Caption"
			: isSame(type, "videoMessage")
			? mText.message.videoMessage.caption || "No Caption"
			: isSame(type, "viewOnceMessage") && mText.message.viewOnceMessage.message.imageMessage
			? mText.message.viewOnceMessage.message.imageMessage.caption || "No Caption"
			: isSame(type, "viewOnceMessage") && mText.message.viewOnceMessage.message.videoMessage
			? mText.message.viewOnceMessage.message.videoMessage.caption || "No Caption"
			: isSame(type, "reactionMessage")
			? mText.message.reactionMessage.text
			: "Unknown body";
		const args = body?.split(/ +/g);
		const cmd = body?.toLowerCase()?.split(" ")[0] || "";
		const { multi, noPref, pref } = cache;
		let prf;
		if (multi) prf = /^[°π÷×¶∆£¢€¥®™✓_=+|~!#$%^&.\/\\©^>]/.test(cmd) ? cmd.match(/^[°π÷×¶∆£¢€¥®™✓_=+|~!#$%^&.\/\\©^>]/gi) : "-";
		else if (noPref) prf = "";
		else prf = pref;
		const isCmd = body?.startsWith(prf);
		const query = args?.slice(1)?.join(" ");
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
		const isMedia = isSame(type, "imageMessage") || isSame(type, "videoMessage");
		const isQuotedImage = isSame(type, "extendedTextMessage") && !content.includes("viewOnceMessage") && content.includes("imageMessage");
		const isQuotedVideo = isSame(type, "extendedTextMessage") && !content.includes("viewOnceMessage") && content.includes("videoMessage");
		const isQuotedSticker = isSame(type, "extendedTextMessage") && content.includes("stickerMessage");
		const isQuotedAudio = isSame(type, "extendedTextMessage") && content.includes("audioMessage");
		const isQuotedDocument = isSame(type, "extendedTextMessage") && content.includes("documentMessage");
		const isQuotedContact = isSame(type, "extendedTextMessage") && content.includes("contactMessage");
		const isQuotedLocation = isSame(type, "extendedTextMessage") && content.includes("locationMessage");
		const isQuotedLiveLocation = isSame(type, "extendedTextMessage") && content.includes("liveLocationMessage");
		const isQuotedContactsArray = isSame(type, "extendedTextMessage") && content.includes("contactsArrayMessage");
		let typeQuoted =
			isSame(type, "extendedTextMessage") && m.message.extendedTextMessage
				? Object.keys(
						m.message.extendedTextMessage.contextInfo ? (m.message.extendedTextMessage.contextInfo.quotedMessage ? m.message.extendedTextMessage.contextInfo.quotedMessage : "") : "",
				  )[0]
				: type;
		const isMediaVid = isSame(type, "videoMessage") || isQuotedVideo;
		const isMediaImage = isSame(type, "imageMessage") || isQuotedImage;
		const isSticker = isSame(type, "stickerMessage");
		const isAudio = isSame(type, "audioMessage");
		const isContact = isSame(type, "contactMessage");
		const isContactsArray = isSame(type, "contactsArrayMessage");
		const isDocument = isSame(type, "documentMessage");
		const isViewOnce = isSame(type, "viewOnceMessage");
		const isLocation = isSame(type, "locationMessage");
		const isLiveLocation = isSame(type, "liveLocationMessage");
		const isViewOnceImage = isViewOnce && isSame(Object.keys(JSON.parse(JSON.stringify(m?.message?.[type]?.message)))[0], "imageMessage");
		const isViewOnceVideo = isViewOnce && isSame(Object.keys(JSON.parse(JSON.stringify(m?.message?.[type]?.message)))[0], "videoMessage");
		const isQuotedViewOnce = isSame(type, "extendedTextMessage") && content.includes("viewOnceMessage");
		const isQuotedViewOnceImage = isQuotedViewOnce && content.includes("viewOnceMessage") && content.includes("imageMessage");
		const isQuotedViewOnceVideo = isQuotedViewOnce && content.includes("viewOnceMessage") && content.includes("videoMessage");
		const typeViewOnce =
			isQuotedViewOnce && isQuotedViewOnceImage
				? "imageMessage"
				: isQuotedViewOnce && isQuotedViewOnceVideo
				? "videoMessage"
				: isViewOnce && isViewOnceImage
				? "imageMessage"
				: isViewOnce && isViewOnceVideo
				? "videoMessage"
				: "";
		let mMediaData =
			isSame(type, "extendedTextMessage") && isNotSame(Object.keys(JSON.parse(JSON.stringify(m).replace("quotedM", "m")).message), "ephemeralMessage")
				? JSON.parse(JSON.stringify(m).replace("quotedM", "m"))?.message?.extendedTextMessage?.contextInfo
				: mText;
		if (
			isSame(type, "extendedTextMessage") &&
			isSame(Object.keys(JSON.parse(JSON.stringify(m).replace("quotedM", "m")).message), "ephemeralMessage") &&
			JSON.parse(JSON.stringify(m).replace("quotedM", "m"))?.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo.message
		) {
			typeQuoted = Object.keys(JSON.parse(JSON.stringify(m).replace("quotedM", "m"))?.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.message);
			mMediaData = JSON.parse(JSON.stringify(m).replace("quotedM", "m"))?.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo;
		}
		const mediaData = isSame(type, "extendedTextMessage") ? (isSame(typeQuoted, "thumbnailMessage") ? mText : mMediaData || {}) : mText || {};
		const typeMessage = [
			"audioMessage",
			"buttonsMessage",
			"buttonsResponseMessage",
			"cancelPaymentRequestMessage",
			"collectionMessage",
			"contactMessage",
			"contactsArrayMessage",
			"conversation",
			"declinePaymentRequestMessage",
			"deviceSentMessage",
			"documentMessage",
			"extendedTextMessage",
			"futureProofMessage",
			"groupInviteMessage",
			"handshakeMessage",
			"highlyStructuredMessage",
			"imageMessage",
			"interactiveMessage",
			"interactiveResponseMessage",
			"invoiceMessage",
			"keepInChatMessage",
			"listMessage",
			"listResponseMessage",
			"liveLocationMessage",
			"locationMessage",
			"mentionText",
			"nativeFlowMessage",
			"nativeFlowResponseMessage",
			"orderMessage",
			"paymentInviteMessage",
			"pollCreationMessage",
			"pollUpdateMessage",
			"pollVoteMessage",
			"productMessage",
			"protocolMessage",
			"reactionMessage",
			"requestPaymentMessage",
			"sendPaymentMessage",
			"senderKeyDistributionMessage",
			"shopMessage",
			"stickerMessage",
			"stickerSyncRMRMessage",
			"syncActionMessage",
			"templateButtonReplyMessage",
			"templateMessage",
			"thumbnailMessage",
			"videoMessage",
		];
		const bodyQuoted = typeMessage.includes(isSame(type, "extendedTextMessage") && mMediaData ? Object.keys(mMediaData.message ? mMediaData.message : { CLIENT: "m" })[0] : "none")
			? isSame(typeQuoted, "conversation")
				? mMediaData.message.conversation
				: isSame(typeQuoted, "extendedTextMessage")
				? mMediaData.message.extendedTextMessage.text
				: isSame(typeQuoted, "mentionText")
				? mMediaData.message.extendedTextMessage.text
				: isSame(typeQuoted, "imageMessage")
				? isUndefined(mMediaData.message.imageMessage.caption)
					? "Image Message"
					: mMediaData.message.imageMessage.caption
				: isSame(typeQuoted, "stickerMessage")
				? "sticker"
				: isSame(typeQuoted, "audioMessage")
				? "audio"
				: isSame(typeQuoted, "videoMessage")
				? isUndefined(mMediaData.message.videoMessage.caption)
					? "Video Message"
					: mMediaData.message.videoMessage.caption
				: isSame(typeQuoted, "documentMessage")
				? "document"
				: isSame(typeQuoted, "thumbnailMessage")
				? mMediaData.message
				: isSame(typeQuoted, "contactMessage")
				? "contact"
				: isSame(typeQuoted, "contactsArrayMessage")
				? "contactArray"
				: isSame(typeQuoted, "groupInviteMessage")
				? "invitation"
				: isSame(typeQuoted, "buttonsMessage")
				? mMediaData.message.buttonsMessage
				: isSame(typeQuoted, "buttonsResponseMessage")
				? `${mMediaData.message.buttonsResponseMessage.contentText}\n${mMediaData.message.buttonsResponseMessage.footerText}`
				: isSame(typeQuoted, "templateButtonReplyMessage") && mMediaData.message.templateButtonReplyMessage
				? mMediaData.message.templateButtonReplyMessage.selectedId
				: isSame(typeQuoted, "templateMessage") && mMediaData.message.templateMessage
				? mMediaData.message.templateMessage.hydratedTemplate.hydratedContentText
				: isSame(typeQuoted, "viewOnceMessage") && mMediaData.message.viewOnceMessage.message.imageMessage
				? isEmpty(mMediaData.message.viewOnceMessage.message.imageMessage.caption)
					? "View Once Image"
					: mMediaData.message.viewOnceMessage.message.imageMessage.caption
				: isSame(type, "viewOnceMessage") && mMediaData.message.viewOnceMessage.message.videoMessage
				? isEmpty(mMediaData.message.viewOnceMessage.message.videoMessage.caption)
					? "View Once Video"
					: mMediaData.message.viewOnceMessage.message.videoMessage.caption
				: ""
			: "";
		const mention = mText?.message[isSame(type, "mentionText") ? "extendedTextMessage" : type]?.contextInfo
			? mText.message[isSame(type, "mentionText") ? "extendedTextMessage" : type]?.contextInfo?.mentionedJid
				? isSame(type, "extendedTextMessage") || isSame(type, "mentionText")
					? mText.message.extendedTextMessage.contextInfo.mentionedJid
					: isSame(type, "imageMessage")
					? mText.message.imageMessage.contextInfo.mentionedJid
					: isSame(type, "videoMessage")
					? mText.message.videoMessage.contextInfo.mentionedJid
					: isSame(type, "stickerMessage")
					? mText.message.stickerMessage.contextInfo.mentionedJid
					: isSame(type, "documentMessage")
					? mText.message.documentMessage.contextInfo.mentionedJid
					: isSame(type, "conversation")
					? mText.message.conversation.contextInfo.mentionedJid
					: isSame(type, "ephemeralMessage")
					? mText.message.ephemeralMessage.message.extendedTextMessage.contextInfo.mentionedJid
					: []
				: []
			: [];
		const extractMediaData =
			isQuotedImage || isQuotedVideo || isQuotedAudio || isQuotedContact || isQuotedContactsArray || isQuotedDocument || isQuotedLiveLocation || isQuotedLocation || isQuotedSticker
				? mediaData?.message?.[typeQuoted]
				: isMedia || isSticker || isAudio || isContact || isContactsArray || isDocument || isLocation || isLiveLocation
				? JSON.parse(JSON.stringify(m?.message?.[type]))
				: isViewOnce && (isViewOnceImage || isViewOnceVideo)
				? JSON.parse(JSON.stringify(m?.message?.[type]?.message)) && JSON.parse(JSON.stringify(m?.message?.[type]?.message?.[typeViewOnce]))
				: isQuotedViewOnce && (isQuotedViewOnceImage || isQuotedViewOnceVideo)
				? mediaData?.message?.[typeQuoted]?.message?.[typeViewOnce]
				: {};
		const typeSticker = ["imageMessage", "videoMessage", "stickerMessage"];
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

const compare = (obj1, obj2) => {
	return JSON.stringify(obj1) === JSON.stringify(obj2);
};

const caching = async (clients, id) => {
	await new Promise(async (resolve) => {
		const groupMetadata = (await clients[botNum].groupMetadata(id).catch((e) => undefined)) || {};
		const partc = groupMetadata.participants;
		cache.metadata.set(id, {
			...groupMetadata,
			rawParticipants: partc || [],
			adminGroups: partc?.filter((v) => isNotNull(v.admin))?.map((v) => v.id),
			participantsGroups: partc?.map((v) => v.id),
			ownerGroups: partc?.find((v) => v.admin == "superadmin")?.id || null,
		});
		resolve();
	});
	if (isFirstConnection) {
		await startMetadataLoop(clients, 3);
		await startBlocklistLoop(clients, 6);
	}
	isFirstConnection = false;
};

const startBlocklistLoop = async (clients, ms) => {
	cache.interval.set(
		"blocklist",
		setInterval(async () => {
			try {
				const dataBlock = await clients[botNum].fetchBlocklist();
				if (!compare(dataBlock, cache.blocklist)) {
					cache.blocklist = dataBlock;
				}
			} catch (err) {
				cache.interval.delete("blocklist");
			}
		}, ms * 1000),
	);
};

const startMetadataLoop = async (clients, ms) => {
	cache.interval.set(
		"groupMetadata",
		setInterval(async () => {
			try {
				const data = cache.metadata.values();
				const SETTINGS = readJSON("./Config/settings.json");
				const dataBanned = readJSON("./Databases/Users/banned.json");
				if (!compare(dataBanned, cache.bannedlist)) {
					cache.bannedlist = dataBanned;
				}
				if (!compare(SETTINGS, cache.config)) {
					cache.config = SETTINGS;
				}
				for (const d of data) {
					if (d.id) {
						const groupMetadata = (await clients[botNum].groupMetadata(d.id)) || {};
						const partc = groupMetadata.participants;
						groupMetadata.rawParticipants = partc || [];
						groupMetadata.adminGroups = partc?.filter((v) => isNotNull(v.admin))?.map((v) => v.id);
						groupMetadata.participantsGroups = partc?.map((v) => v.id);
						groupMetadata.ownerGroups = partc?.find((v) => v.admin == "superadmin")?.id || null;
						if (groupMetadata.id && !compare(groupMetadata, d)) {
							cache.metadata.set(groupMetadata.id, {
								...groupMetadata,
								rawParticipants: partc || [],
								adminGroups: partc?.filter((v) => isNotNull(v.admin))?.map((v) => v.id),
								participantsGroups: partc?.map((v) => v.id),
								ownerGroups: partc?.find((v) => v.admin == "superadmin")?.id || null,
							});
						}
					}
				}
			} catch (err) {
				cache.interval.delete("blocklist");
			}
		}, ms * 1000),
	);
};
