import {
	delay,
	downloadContentFromMessage,
	downloadMediaMessage as downloadMessage,
	generateWAMessage,
	generateWAMessageFromContent,
	getContentType,
	toBuffer,
} from "@adiwajshing/baileys";
import PhoneNumber from "awesome-phonenumber";
import Axios from "axios";
import { fileTypeFromBuffer } from "file-type";
import ffmpeg from "fluent-ffmpeg";
import moment from "moment-timezone";
import webpmux from "node-webpmux";
import sharp from "sharp";
import { TextEncoder } from "util";
import { checkJSON, pushDefaultSettings, updateSettings } from "../Groups/Settings/index.js";
import { NO_DATA, S_WHATSAPP_NET, UPDATE, ZERO } from "../Misc/WAData/index.js";
import { delaySync, isEmpty, isNotNull, isNotSame, isSame, isUndefined, isURL, readJSON, writeBuffer } from "./index.js";
const { readFile, unlink, writeFile } = (await import("fs-extra")).default;

moment.tz.setDefault("Asia/Jakarta").locale("id");
export const reassign = async (m, client, store, search, deleted) => {
	try {
		const SETTINGS = readJSON("./Config/settings.json");
		if (m.message?.protocolMessage && m.message.protocolMessage.type == "REVOKE") return m;
		if (!search && deleted) {
			if (m.message && m.messageTimestamp) {
				if (moment(m.messageTimestamp * 1000).unix() < moment(moment().subtract("5", "seconds").valueOf()).unix()) return { error: "OLD MESSAGE" };
			} else if (moment(JSON.parse(m.messageTimestamp * 1000)).unix() < moment(moment().subtract("5", "seconds").valueOf()).unix()) return { error: "OLD MESSAGE" };
		}
		delete m?.message?.messageContextInfo;
		delete m?.message?.senderKeyDistributionMessage;
		const isFromMe = m?.key?.fromMe;
		const from = m?.key?.remoteJid || m.from;
		global.where = from;
		const isGroup = from.endsWith("@g.us");
		let groupSettings;
		const isBaileys = (m?.key?.id?.startsWith("BAE5") && isSame(m?.key?.id?.length, 16)) || (isFromMe && m?.key?.id?.startsWith("VOID"));
		const sender = isFromMe ? `${client[botNum].user.id.split(":")[0]}@s.whatsapp.net` : isGroup ? m?.key?.participant : m?.key?.remoteJid;
		const isBlocked = (await client[botNum].fetchBlocklist())?.includes(sender);
		if (isBlocked) return;
		const prettyNumber =
			PhoneNumber(`+${sender?.replace("@s.whatsapp.net", "")}`)?.getNumber("international") ??
			PhoneNumber(`+${m?.key?.participant?.replace("@s.whatsapp.net", "")}`)?.getNumber("international") ??
			"No Data";
		const groupMetadata = isGroup ? await client[botNum].groupMetadata(from).catch((e) => {}) : {};
		const groupName = isGroup ? groupMetadata?.subject : NO_DATA;
		const groupDescription = isGroup ? groupMetadata?.desc?.toString() : NO_DATA;
		const groupId = isGroup ? groupMetadata?.id : NO_DATA;
		if (isGroup) {
			if (typeof checkJSON(from) == "boolean") {
				pushDefaultSettings(from, groupName, groupDescription);
				groupSettings = checkJSON(from);
			} else if ("GROUP_CHANGE_SUBJECT" == m.messageStubType) {
				groupSettings = checkJSON(from);
				updateSettings("groupName", groupName, from);
			} else if ("GROUP_CHANGE_DESCRIPTION" == m.messageStubType) {
				groupSettings = checkJSON(from);
				updateSettings("groupDescription", groupDescription, from);
			} else {
				groupSettings = checkJSON(from);
			}
		}
		const isGroupOwner = isGroup ? (isSame((await client[botNum].groupMetadata(from).catch((e) => {}))?.owner, sender) ? true : false) : false;
		const content = JSON.stringify(m?.message, null, 2);
		const pushname = m?.pushName ? m?.pushName.trim() : store?.messages?.[sender]?.toJSON?.()?.reverse?.()?.[0]?.pushName || prettyNumber;
		const botNumber = `${client[botNum].user.id.split(":")[0]}@s.whatsapp.net`;
		const ownerNumbers = [SETTINGS.owner_number, ...SETTINGS.team_number, botNumber];
		const isOwner = ownerNumbers.includes(sender);
		const timeStamp = m?.messageTimestamp || Date.now();
		const filename = sender + (m?.key?.id || Date.now());
		if (!m.message)
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
		m.message = isSame(Object.keys(m.message)[0], "ephemeralMessage") ? m.message.ephemeralMessage.message : m.message;
		let type = getContentType(m.message);
		type = isSame(type, "messageContextInfo") ? (type = Object.keys(m.message)[1]) : type;
		type = isSame(type, "extendedTextMessage") && m.message?.extendedTextMessage?.text?.includes("@") ? (type = "mentionText") : type;
		let mText = m;
		if (isSame(type, "ephemeralMessage")) {
			type = Object.keys(m.message?.ephemeralMessage?.message);
			mText = m.message.ephemeralMessage;
		}
		const rawParticipants = groupMetadata?.participants ? groupMetadata?.participants : [];
		const adminGroups = rawParticipants?.filter((v) => isNotNull(v.admin)).map((v) => v.id);
		const participantsGroups = rawParticipants?.map((v) => v.id);
		const ownerGroups = rawParticipants?.find((v) => v.admin == "superadmin")?.id || null;
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
		const { multi, noPref } = SETTINGS.prefix;
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

		const reply = async ({ from, quoted }, text) => {
			return await client[botNum].sendMessage(from, { text }, { quoted });
		};
		const applyExif = async (buffer, metadata) => {
			const data = {};
			data["sticker-pack-id"] = metadata?.id || "";
			data["sticker-pack-name"] = metadata?.pack || "";
			data["sticker-pack-publisher"] = metadata?.author || "";
			const exif = Buffer.concat([
				Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]),
				Buffer.from(JSON.stringify(data), "utf-8"),
			]);
			exif.writeUIntLE(new TextEncoder().encode(JSON.stringify(data)).length, 14, 4);
			buffer =
				buffer instanceof webpmux.Image
					? buffer
					: await (async () => {
							const img = new webpmux.Image();
							await img.load(buffer);
							return img;
					  })();
			buffer.exif = exif;
			return await buffer.save(null);
		};
		const prepareSticker = async (media, filename, type, options) => {
			const isMediaURL = Buffer.isBuffer(media) ? false : isURL(media) ? true : false;
			media = isMediaURL ? (await Axios.get(media, { responseType: "arraybuffer", headers: { DNT: 1, "Upgrade-Insecure-Request": 1 } })).data : media;
			const bufferType = type == "imageMessage" ? "image" : type == "videoMessage" ? "video" : (await fileTypeFromBuffer(media)).mime.includes("video") ? "video" : "image";
			if (bufferType == "video") {
				const [video, webp] = ["video", "webp"].map((ext) => `${filename}.${ext}`);
				await writeFile(video, media);
				await new Promise((resolve) => {
					ffmpeg(video)
						.videoCodec("libwebp")
						.outputFPS(14)
						.videoFilter("scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,setsar=1")
						.duration(10)
						.save(webp)
						.on("end", resolve);
				});
				media = await readFile(webp);
				[video, webp].forEach((file) => unlink(file));
			} else {
				media = await sharp(media, { animated: bufferType == "video" })
					.resize(512, 512, {
						fit: sharp.fit.contain,
						background: { r: 0, g: 0, b: 0, alpha: 0 },
					})
					.webp()
					.toBuffer();
			}
			return await applyExif(media, options);
		};
		const downloadAndSaveMediaMessage = async (media, path) => {
			const msg = await downloadContentFromMessage(media, typeQuoted.replace(/Message/g, ""));
			const buffer = await toBuffer(msg);
			await writeFile(path, buffer);
			return path;
		};
		const downloadMediaMessage = async (media, typeDownloadable = "buffer") => {
			return await downloadMessage(media, typeDownloadable);
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
					return await generateWAMessage(ZERO, { image: isURL(media) ? { url: media } : media }, { ...opts, upload: client[botNum].waUploadToServer });
				}
				case "videoMessage": {
					return await generateWAMessage(ZERO, { video: isURL(media) ? { url: media } : media }, { ...opts, upload: client[botNum].waUploadToServer });
				}
				case "audioMessage": {
					return await generateWAMessage(ZERO, { audio: isURL(media) ? { url: media } : media }, { ...opts, upload: client[botNum].waUploadToServer });
				}
				case "documentMessage": {
					return await generateWAMessage(
						ZERO,
						{ document: isURL(media) ? { url: media } : media, fileName: opts.fileName, mimetype: opts.mimetype },
						{ ...opts, upload: client[botNum].waUploadToServer },
					);
				}
				case "stickerMessage": {
					return await generateWAMessage(ZERO, { sticker: isURL(media) ? { url: media } : media }, { ...opts, upload: client[botNum].waUploadToServer });
				}
				case "locationMessage": {
					return await generateWAMessage(ZERO, { ...media }, { ...opts, upload: client[botNum].waUploadToServer });
				}
			}
		};
		const buttonDocument = async (dari, contentText, footerText, buttons, media, opts = {}) => {
			if (buttons.length == 0) return new Error("Buttons is empty");
			const document = await prepareMedia(media, "documentMessage", opts);
			const message = generateWAMessageFromContent(
				ZERO,
				{ buttonsMessage: { buttons, contentText, footerText, headerType: 3, contextInfo: opts.contextInfo, documentMessage: document.message.documentMessage } },
				opts,
			);
			client[botNum].relayMessage(dari, message.message, { messageId: message.key.id });
			return message;
		};

		const buttonLocation = async (dari, contentText, footerText, buttons, media, opts = {}) => {
			if (buttons.length == 0) return new Error("Buttons is empty");
			const location = await generateWAMessage(ZERO, { location: { degreesLatitude: 0, degreesLongitude: 0, jpegThumbnail: media, name: "provided by nanda" } }, opts);
			const message = generateWAMessageFromContent(
				ZERO,
				{ buttonsMessage: { buttons, contentText, footerText, headerType: 6, contextInfo: opts.contextInfo, locationMessage: location.message.locationMessage } },
				opts,
			);
			client[botNum].relayMessage(dari, message.message, { messageId: message.key.id });
			return message;
		};

		const setStatus = async (status) => {
			if (!status) return new Error("Status is empty");
			return await client[botNum].query({
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
		};

		const updateGroup = async (dari, containers, update, texts, force, message) => {
			const responses = [];
			if (update.PARSE_EVENTS("ADD", "REMOVE", "DEMOTE", "PROMOTE")) {
				for (const container of containers) {
					try {
						if (!force && adminGroups.includes(container) && update == "REMOVE") {
							await client[botNum].sendMessage(
								dari,
								{ text: `You can't ${update} @${container.split("@")[0]} because it's admin group.\nadd --force flag to force update admin`, mentions: [container] },
								{ quoted: message },
							);
							continue;
						}
						if (adminGroups.includes(container) && update == "PROMOTE") {
							await client[botNum].sendMessage(
								dari,
								{ text: `You can't ${update} @${container.split("@")[0]} because they already an admin group.`, mentions: [container] },
								{ quoted: message },
							);
							continue;
						}
						if (!adminGroups.includes(container) && update == "DEMOTE") {
							await client[botNum].sendMessage(
								dari,
								{ text: `You can't ${update} @${container.split("@")[0]} because they already a member group.`, mentions: [container] },
								{ quoted: message },
							);
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
				const { message, body, isCmd } = await reassign(JSON.parse(JSON.stringify(messages)), client, store, true);
				if (body.includes(query) && !isCmd) {
					keys.push(message);
					i++;
				}
			}
			return keys;
		};

		client[botNum] = {
			...client[botNum],
			prepareSticker,
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
