import { toBuffer, downloadContentFromMessage, generateWAMessageFromContent, generateWAMessage, getContentType } from "@adiwajshing/baileys";
import moment from "moment-timezone";
import PhoneNumber from "awesome-phonenumber";
import { isSame, isNotSame, isEmpty, isNotNull, readJSON, isUndefined, isURL, writeBuffer, writeJSON, delaySync } from "./functions.js";
const ZERO = "0@s.whatsapp.net";
const S_WHATSAPP_NET = "@s.whatsapp.net";
const UPDATE = {
	ADD: "groupParticipantsUpdate",
	REMOVE: "groupParticipantsUpdate",
	DEMOTE: "groupParticipantsUpdate",
	PROMOTE: "groupParticipantsUpdate",
	SUBJECT: "groupUpdateSubject",
	DESCRIPTION: "groupUpdateDescription",
	ANNOUNCEMENT: "groupSettingUpdate",
	NOT_ANNOUNCEMENT: "groupSettingUpdate",
	UNLOCKED: "groupSettingUpdate",
	LOCKED: "groupSettingUpdate",
	RETRIEVE: "groupInviteCode",
	REVOKE: "groupRevokeInvite",
};
String.prototype.PARSE_EVENTS = function (...args) {
	return args.some((v) => v == this);
};
moment.tz.setDefault("Asia/Jakarta").locale("id");
export const reassign = async (m, client, store, search) => {
	try {
		const SETTINGS = readJSON("./Config/settings.json");
		if (m.message && m.message.protocolMessage && m.message.protocolMessage.type == "REVOKE") return m;
		if (!search) {
			if (m.message && m.messageTimestamp) {
				if (moment(m.messageTimestamp * 1000).unix() < moment(moment().subtract("5", "seconds").valueOf()).unix()) return { error: "OLD MESSAGE" };
			} else if (moment(JSON.parse(m.messageTimestamp * 1000)).unix() < moment(moment().subtract("5", "seconds").valueOf()).unix()) return { error: "OLD MESSAGE" };
		}
		if (!m.message) return m;
		m.message = isSame(Object.keys(m.message)[0], "ephemeralMessage") ? m.message.ephemeralMessage.message : m.message;
		const isFromMe = m.key.fromMe;
		const from = m.key.remoteJid;
		global.where = from;
		const isGroup = from.endsWith("@g.us");
		let groupSettings;
		if (isGroup) {
			if (typeof checkJSON(from) == "boolean") {
				groupSettings = pushDefaultSettings(from);
			}
			groupSettings = checkJSON(from);
		}
		const isBaileys = (m.key.id.startsWith("BAE5") && isSame(m.key.id.length, 16)) || (isFromMe && m.key.id.startsWith("VOID"));
		const sender = isFromMe ? `${client[botNum].user.id.split(":")[0]}@s.whatsapp.net` : isGroup ? m.key.participant : m.key.remoteJid;
		const prettyNumber = PhoneNumber(`+${sender.replace("@s.whatsapp.net", "")}`).getNumber("international") ?? PhoneNumber(`+${m.key.participant.replace("@s.whatsapp.net", "")}`).getNumber("international");
		const groupMetadata = isGroup ? await client[botNum].groupMetadata(from).catch((e) => {}) : "";
		const groupName = isGroup ? groupMetadata?.subject : "";
		const groupId = isGroup ? groupMetadata?.id : "";
		const isGroupOwner = isGroup ? (isSame((await client[botNum].groupMetadata(from)).owner, sender) ? true : false) : "";
		const content = JSON.stringify(m.message, null, 2);
		const pushname = m.pushName;
		const botNumber = `${client[botNum].user.id.split(":")[0]}@s.whatsapp.net`;
		const ownerNumbers = [SETTINGS.owner_number, ...SETTINGS.team_number, botNumber];
		const isOwner = ownerNumbers.includes(sender);
		const timeStamp = m.messageTimestamp;
		const filename = sender + m.key.id;
		let type = getContentType(m.message);
		type = isSame(type, "messageContextInfo") ? (type = Object.keys(m.message)[1]) : type;
		type = isSame(type, "extendedTextMessage") && m.message?.extendedTextMessage?.text?.includes("@") ? (type = "mentionText") : type;
		let mText = m;
		if (isSame(type, "ephemeralMessage")) {
			type = Object.keys(m.message?.ephemeralMessage?.message);
			mText = m.message.ephemeralMessage;
		}
		const rawParticipants = groupMetadata.participants ? groupMetadata.participants : [];
		const adminGroups = rawParticipants.filter((v) => isNotNull(v.admin)).map((v) => v.id);
		const participantsGroups = rawParticipants.map((v) => v.id);
		const ownerGroups = rawParticipants.find((v) => v.admin == "superadmin")?.id || null;
		const isAdmin = adminGroups.includes(sender);
		const isBotAdmin = adminGroups.includes(botNumber);
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
			: "Unknown body";
		const args = body?.split(/ +/g);
		const cmd = body?.toLowerCase()?.split(" ")[0] || "";
		const multi = SETTINGS.prefix.multi;
		const noPref = SETTINGS.prefix.nopref;
		const pref = SETTINGS.prefix.pref || ".";
		let prf;
		if (multi) prf = /^[°π÷×¶∆£¢€¥®™✓_=+|~!#$%^&.\/\\©^>]/.test(cmd) ? cmd.match(/^[°π÷×¶∆£¢€¥®™✓_=+|~!#$%^&.\/\\©^>]/gi) : "-";
		else if (noPref) prf = "";
		else prf = pref;
		const isCmd = body?.startsWith(prf);
		const query = args?.slice(1)?.join(" ");
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
		let typeQuoted = isSame(type, "extendedTextMessage") && m.message.extendedTextMessage ? Object.keys(m.message.extendedTextMessage.contextInfo ? (m.message.extendedTextMessage.contextInfo.quotedMessage ? m.message.extendedTextMessage.contextInfo.quotedMessage : "") : "")[0] : type;
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
		const isViewOnceImage = isViewOnce && isSame(Object.keys(JSON.parse(JSON.stringify(m.message[type].message)))[0], "imageMessage");
		const isViewOnceVideo = isViewOnce && isSame(Object.keys(JSON.parse(JSON.stringify(m.message[type].message)))[0], "videoMessage");
		const isQuotedViewOnce = isSame(type, "extendedTextMessage") && content.includes("viewOnceMessage");
		const isQuotedViewOnceImage = isQuotedViewOnce && content.includes("viewOnceMessage") && content.includes("imageMessage");
		const isQuotedViewOnceVideo = isQuotedViewOnce && content.includes("viewOnceMessage") && content.includes("videoMessage");
		const typeViewOnce = isQuotedViewOnce && isQuotedViewOnceImage ? "imageMessage" : isQuotedViewOnce && isQuotedViewOnceVideo ? "videoMessage" : isViewOnce && isViewOnceImage ? "imageMessage" : isViewOnce && isViewOnceVideo ? "videoMessage" : "";
		let mMediaData = isSame(type, "extendedTextMessage") && isNotSame(Object.keys(JSON.parse(JSON.stringify(m).replace("quotedM", "m")).message), "ephemeralMessage") ? JSON.parse(JSON.stringify(m).replace("quotedM", "m")).message.extendedTextMessage?.contextInfo : mText;
		if (isSame(type, "extendedTextMessage") && isSame(Object.keys(JSON.parse(JSON.stringify(m).replace("quotedM", "m")).message), "ephemeralMessage") && JSON.parse(JSON.stringify(m).replace("quotedM", "m")).message.ephemeralMessage.message.extendedTextMessage?.contextInfo.message) {
			typeQuoted = Object.keys(JSON.parse(JSON.stringify(m).replace("quotedM", "m")).message.ephemeralMessage.message.extendedTextMessage.contextInfo.message);
			mMediaData = JSON.parse(JSON.stringify(m).replace("quotedM", "m")).message.ephemeralMessage.message.extendedTextMessage?.contextInfo;
		}
		const mediaData = isSame(type, "extendedTextMessage") ? (isSame(typeQuoted, "thumbnailMessage") ? mText : mMediaData || {}) : mText || {};
		const typeMessage = [
			"conversation",
			"extendedTextMessage",
			"mentionText",
			"imageMessage",
			"stickerMessage",
			"audioMessage",
			"videoMessage",
			"documentMessage",
			"contactMessage",
			"contactsArrayMessage",
			"thumbnailMessage",
			"viewOnceMessage",
			"buttonsMessage",
			"buttonsResponseMessage",
			"templateMessage",
			"templateButtonReplyMessage",
			"messageContextInfo",
			"groupInviteMessage",
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
				? mediaData.message[typeQuoted]
				: isMedia || isSticker || isAudio || isContact || isContactsArray || isDocument || isLocation || isLiveLocation
				? JSON.parse(JSON.stringify(m.message[type]))
				: isViewOnce && (isViewOnceImage || isViewOnceVideo)
				? JSON.parse(JSON.stringify(m.message[type].message)) && JSON.parse(JSON.stringify(m.message[type].message[typeViewOnce]))
				: isQuotedViewOnce && (isQuotedViewOnceImage || isQuotedViewOnceVideo)
				? mediaData.message[typeQuoted].message && mediaData.message[typeQuoted].message[typeViewOnce]
				: {};
		const reply = async ({ from, quoted }, text) => {
			return await client[botNum].sendMessage(from, { text }, { quoted });
		};
		const downloadAndSaveMediaMessage = async (media, path) => {
			const msg = await downloadContentFromMessage(media, typeQuoted.replace(/Message/g, ""));
			const buffer = await toBuffer(msg);
			writeBuffer(path, buffer);
			return path;
		};
		const downloadMediaMessage = async (media) => {
			const msg = await downloadContentFromMessage(media, typeQuoted.replace(/Message/g, ""));
			const buffer = await toBuffer(msg);
			return buffer;
		};
		const buttonText = async (dari, contentText, footerText, buttons, opts = {}) => {
			if (buttons.length == 0) return new Error("Buttons is empty");
			const message = generateWAMessageFromContent(
				ZERO,
				{
					buttonsMessage: {
						buttons,
						contentText,
						footerText,
						headerType: 1,
						contextInfo: opts.contextInfo,
					},
				},
				opts,
			);
			client[botNum].relayMessage(dari, message.message, { messageId: message.key.id });
			return message;
		};
		const prepareMedia = async (media, type, opts = {}) => {
			switch (type) {
				case "imageMessage": {
					return isURL(media) ? await generateWAMessage(ZERO, { image: { url: media } }, { ...opts, upload: client[botNum].waUploadToServer }) : await generateWAMessage(ZERO, { image: media }, { ...opts, upload: client[botNum].waUploadToServer });
				}
				case "videoMessage": {
					return isURL(media) ? await generateWAMessage(ZERO, { video: { url: media } }, { ...opts, upload: client[botNum].waUploadToServer }) : await generateWAMessage(ZERO, { video: media }, { ...opts, upload: client[botNum].waUploadToServer });
				}
				case "audioMessage": {
					return isURL(media) ? await generateWAMessage(ZERO, { audio: { url: media } }, { ...opts, upload: client[botNum].waUploadToServer }) : await generateWAMessage(ZERO, { audio: media }, { ...opts, upload: client[botNum].waUploadToServer });
				}
				case "documentMessage": {
					return isURL(media)
						? await generateWAMessage(ZERO, { document: { url: media }, fileName: opts.fileName, mimetype: opts.mimetype }, { ...opts, upload: client[botNum].waUploadToServer })
						: await generateWAMessage(ZERO, { document: media, fileName: opts.fileName, mimetype: opts.mimetype }, { ...opts, upload: client[botNum].waUploadToServer });
				}
				case "stickerMessage": {
					return isURL(media) ? await generateWAMessage(ZERO, { sticker: { url: media } }, { ...opts, upload: client[botNum].waUploadToServer }) : await generateWAMessage(ZERO, { sticker: media }, { ...opts, upload: client[botNum].waUploadToServer });
				}
				case "locationMessage": {
					return await generateWAMessage(ZERO, { ...media }, { ...opts, upload: client[botNum].waUploadToServer });
				}
			}
		};
		const buttonDocument = async (dari, contentText, footerText, buttons, media, opts = {}) => {
			if (buttons.length == 0) return new Error("Buttons is empty");
			const document = await prepareMedia(media, "documentMessage", opts);
			const message = generateWAMessageFromContent(ZERO, { buttonsMessage: { buttons, contentText, footerText, headerType: 3, contextInfo: opts.contextInfo, documentMessage: document.message.documentMessage } }, opts);
			client[botNum].relayMessage(dari, message.message, { messageId: message.key.id });
			return message;
		};

		const buttonLocation = async (dari, contentText, footerText, buttons, media, opts = {}) => {
			if (buttons.length == 0) return new Error("Buttons is empty");
			const location = await generateWAMessage(ZERO, { location: { degreesLatitude: 0, degreesLongitude: 0, jpegThumbnail: media, name: "provided by nanda" } }, opts);
			const message = generateWAMessageFromContent(ZERO, { buttonsMessage: { buttons, contentText, footerText, headerType: 6, contextInfo: opts.contextInfo, locationMessage: location.message.locationMessage } }, opts);
			client[botNum].relayMessage(dari, message.message, { messageId: message.key.id });
			return message;
		};

		const setStatus = async (status) => {
			if (!status) return new Error("Status is empty");
			const response = await client[botNum].query({
				tag: "iq",
				attrs: {
					to: S_WHATSAPP_NET,
					type: "set",
					xmlns: "status",
				},
				content: [
					{
						tag: "status",
						attrs: {},
						content: Buffer.from(status, "utf-8"),
					},
				],
			});
			return response;
		};

		const updateGroup = async (dari, containers, update, texts, force, message) => {
			const responses = [];
			if (update.PARSE_EVENTS("ADD", "REMOVE", "DEMOTE", "PROMOTE")) {
				for (const container of containers) {
					try {
						if (!force && adminGroups.includes(container) && update == "REMOVE") {
							await client[botNum].sendMessage(dari, { text: `You can't ${update} @${container.split("@")[0]} because it's admin group.\nadd --force flag to force update admin`, contextInfo: { mentionedJid: [container] } }, { quoted: message });
							continue;
						}
						if (adminGroups.includes(container) && update == "PROMOTE") {
							await client[botNum].sendMessage(dari, { text: `You can't ${update} @${container.split("@")[0]} because they already an admin group.`, contextInfo: { mentionedJid: [container] } }, { quoted: message });
							continue;
						}
						if (!adminGroups.includes(container) && update == "DEMOTE") {
							await client[botNum].sendMessage(dari, { text: `You can't ${update} @${container.split("@")[0]} because they already a member group.`, contextInfo: { mentionedJid: [container] } }, { quoted: message });
							continue;
						}
						const response = await client[botNum][UPDATE[update]](dari, [container], update.toLowerCase());
						delaySync(120);
						responses.push(response);
					} catch (e) {
						responses.push({ error: e.message, id: container });
						log(e);
						client[botNum].reply({ from: dari, quoted: message }, `${container} is not a valid number`);
					}
				}
			}
			if (update.PARSE_EVENTS("SUBJECT", "DESCRIPTION")) {
				const response = await client[botNum][UPDATE[update]](dari, texts);
				responses.push(response);
			}
			if (update.PARSE_EVENTS("ANNOUNCEMENT", "NOT_ANNOUNCEMENT", "UNLOCKED", "LOCKED")) {
				const response = await client[botNum][UPDATE[update]](dari, update.toLowerCase());
				responses.push(response);
			}
			if (update.PARSE_EVENTS("RETRIEVE", "REVOKE")) {
				const response = await client[botNum][UPDATE[update]](dari);
				responses.push(response);
			}
			return responses;
		};

		const searchMessage = async (dari, query) => {
			const containers = await store.loadMessages(dari);
			const keys = [];
			let i = 0;
			if (containers.length == 0) return keys;
			for (const messages of containers) {
				if (i == 20) break;
				const { message, body } = await reassign(JSON.parse(JSON.stringify(messages)), client, store, true);
				if (body.includes(query)) keys.push(message);
				i++;
			}
			return keys;
		};

		client[botNum] = {
			...client[botNum],
			reply,
			downloadAndSaveMediaMessage,
			downloadMediaMessage,
			buttonText,
			buttonDocument,
			buttonLocation,
			setStatus,
			updateGroup,
			searchMessage,
		};
		return {
			message: m,
			isFromMe,
			from,
			isGroup,
			isBaileys,
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
		console.log(e);
		return {
			error: e,
		};
	}
};

const checkJSON = (dari) => {
	const data = readJSON("./Databases/Groups/settingsManager.json");
	if (data.findIndex((v) => Object.keys(v)[0] == dari) != -1) {
		return data[data.findIndex((v) => Object.keys(v)[0] == dari)];
	}
	return false;
};

const pushDefaultSettings = (dari) => {
	const data = readJSON("./Databases/Groups/settingsManager.json");
	const index = data.findIndex((v) => Object.keys(v)[0] == dari);
	if (index == -1) {
		data.push({
			[dari]: {
				welcome1: "disable",
				welcome1msg: "Welcome to {groupName}",
				welcome2: "disable",
				welcome2msg: "Welcome to {groupName}",
				left1: "disable",
				left1msg: "Bye bye {groupName}",
				left2: "disable",
				left2msg: "Bye bye {groupName}",
				antiDelete: "disable",
				antiGroupURL: "disable",
				antiURL: "disable",
				antiSpam: "disable",
				antiVirus: "disable",
				autoReader: "disable",
				games: "disable",
			},
		});
		writeJSON("./Databases/Groups/settingsManager.json", data);
		return data[index];
	}
	return data[index];
};
