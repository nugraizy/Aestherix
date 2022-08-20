import moment from "moment-timezone";
import path from "path";
import { __dirname } from "../../connect.js";
import { getFilesize, getFilesizeFromBytes, readBuffer, unlinkFile } from "../../Helper/Modules/index.js";
import { reassign } from "../../Helper/Modules/reassignMessagesObject.js";
import { CheckIntervals, DeleteIntervals } from "../../Utils/Misc/index.js";

export default {
	async handler(client, message, fetches) {
		try {
			if (message == undefined) return;
			message = await reassign(JSON.parse(JSON.stringify(message)), client, false, true);
			if (message && "error" in message) return;
			const { from, mention: mentioning, timeStamp, sender, body, pushname, extractMediaData, filename, isBaileys, isFromMe, mediaData } = message;
			const messages = message?.message?.message;
			if (!messages) return;
			const type = Object.keys(messages)[0];
			if (isBaileys) return;
			if (isFromMe) return;
			if (from == "status@broadcast") return;
			if (type == "protocolMessage" || type == "senderKeyDistributionMessage" || !type) return;
			if (
				CheckIntervals(intervals.url.get(sender)) !== 0 &&
				CheckIntervals(intervals.url.get(sender).get(from)) !== 0 &&
				CheckIntervals(intervals.url.get(sender).get(from)).id == message.message.key.id
			) {
				await client[botNum].reply({ from, quoted: message }, "Good. Do not send URLs next time or i will kick you.");
				DeleteIntervals(intervals.url.get(sender).get(from), intervals.url.get(sender), from);
				return;
			}
			const stats = message[from]?.antiDelete == "enable" ? true : fetches ? true : false;
			if (stats) {
				const options = {
					quoted: message.message,
					contextInfo: {
						mentionedJid: [],
					},
				};

				const mentioningReply = messages[type].contextInfo?.participant ? messages[type].contextInfo.participant.toString() : "";
				const replyParticipants = messages[type].contextInfo?.participant ? messages[type].contextInfo.participant.split("@")[0] : "";
				options.contextInfo.mentionedJid.push(sender, ...mentioning);
				if (mentioningReply !== "") {
					options.contextInfo.mentionedJid.push(mentioningReply);
				}

				let typeQuoted = null;
				const captionReply = `\nMessage Replied to : ${replyParticipants}\n`;
				const quotedMessage =
					Object.keys(messages)[0] == type &&
					messages[type].contextInfo &&
					messages[type].contextInfo.quotedMessage &&
					(typeQuoted = Object.keys(messages[type].contextInfo.quotedMessage)[0])
						? `${
								messages[type].contextInfo.quotedMessage.conversation
									? `${captionReply}Type : ${typeQuoted}\nPesan : ${messages[type].contextInfo.quotedMessage.conversation}`
									: messages[type].contextInfo.quotedMessage.extendedTextMessage
									? `${captionReply}Type : ${typeQuoted}\n\nPesan : ${messages[type].contextInfo.quotedMessage.extendedTextMessage.text}`
									: messages[type].contextInfo.quotedMessage.documentMessage
									? `${captionReply}Type : ${typeQuoted}\nFilename : ${messages[type].contextInfo.quotedMessage.documentMessage.fileName}\nMimetype : ${messages[type].contextInfo.quotedMessage.documentMessage.mimetype}`
									: messages[type].contextInfo.quotedMessage.locationMessage
									? `${captionReply}Type : ${typeQuoted}\nLat : ${messages[type].contextInfo.quotedMessage.locationMessage.degreesLatitude}\nLong : ${messages[type].contextInfo.quotedMessage.locationMessage.degreesLongitude}`
									: messages[type].contextInfo.quotedMessage.contactMessage
									? `${captionReply}Type : ${typeQuoted}\nDisplayname : ${messages[type].contextInfo.quotedMessage.contactMessage.displayName}`
									: messages[type].contextInfo.quotedMessage.contactsArrayMessage
									? `${captionReply}Type : ${typeQuoted}\nTotal Contact : ${messages[type].contextInfo.quotedMessage.contactsArrayMessage.contacts.length}\nList Name :\n${messages[
											type
									  ].contextInfo.quotedMessage.contactsArrayMessage.contacts
											.map((arr) => arr.displayName)
											.join("\n")}`
									: messages[type].contextInfo.quotedMessage.imageMessage
									? `${captionReply}Type : ${typeQuoted}\nCaption : ${messages[type].contextInfo.quotedMessage.imageMessage.caption}` == ""
										? "No Caption"
										: messages[type].contextInfo.quotedMessage.imageMessage.caption
									: messages[type].contextInfo.quotedMessage.videoMessage
									? `${captionReply}Type : ${typeQuoted}\nCaption : ${messages[type].contextInfo.quotedMessage.imageMessage.caption}` == ""
										? "No Caption"
										: messages[type].contextInfo.quotedMessage.videoMessage.caption
									: messages[type].contextInfo.quotedMessage.audioMessage
									? `${captionReply}Type : ${typeQuoted}\n${messages[type].contextInfo.quotedMessage.audioMessage.ptt}`
										? `\nType Audio : Voice Note\nMimetype : ${messages[type].contextInfo.quotedMessage.audioMessage.mimetype}`
										: `\nType Audio : Audio File\nMimetype : ${messages[type].contextInfo.quotedMessage.audioMessage.mimetype}`
									: messages[type].contextInfo.quotedMessage.stickerMessage
									? `${captionReply}Type : ${typeQuoted}`
									: ""
						  }`
						: "";
				switch (type) {
					case "extendedTextMessage":
					case "conversation":
						{
							const stringDeleted = `\`\`\`Message Deleted\n\`\`\`
Name : ${pushname}
Type : ${type}
Time : ${moment.unix(timeStamp).format("HH:mm:ss DD/MM/YYYY")}
Message : ${body ? body : "Unknown"}${quotedMessage}
`.trim();
							client[botNum].sendMessage(from, { text: stringDeleted, mentions: options.contextInfo.mentionedJid }, options);
						}
						break;
					case "stickerMessage":
						{
							const result = await client[botNum].downloadMediaMessage(mediaData);
							const fileSize = getFilesizeFromBytes(result);
							const sticker = await client[botNum].prepareSticker(
								result,
								path.join(__dirname, `Temporary Files/${filename}`),
								mediaData.message.stickerMessage.isAnimated ? "stickerAnimated" : "imageMessage",
								{ author, packname },
							);
							const stringDeleted = `\`\`\`Message Deleted\n\`\`\`
Name : ${pushname}			
Type : ${type}
Time : ${moment.unix(timeStamp).format("HH:mm:ss DD/MM/YYYY")}
Size : ${fileSize}${quotedMessage}
`.trim();

							await client[botNum].sendMessage(from, { sticker }, options).then(() => client[botNum].sendMessage(from, { text: stringDeleted }, options));
						}
						break;
					case "imageMessage":
						{
							const image = await client[botNum].downloadAndSaveMediaMessage(
								extractMediaData,
								path.join(__dirname, `Temporary Files/${filename}.${extractMediaData.mimetype.split("/")[1]}`),
								"imageMessage",
							);
							const fileSize = getFilesize(image);
							const stringDeleted = `\`\`\`Message Deleted\n\`\`\`
Name : ${pushname}			
Type : ${type}
Time : ${moment.unix(timeStamp).format("HH:mm:ss DD/MM/YYYY")}
Size : ${fileSize}
Caption : ${body ? body : "Unknown"}${quotedMessage}
`.trim();
							await client[botNum].sendMessage(from, { image: readBuffer(image), caption: stringDeleted, mention: options.contextInfo.mentionedJid }, options);
							unlinkFile(image);
						}
						break;
					case "videoMessage":
						{
							const video = await client[botNum].downloadAndSaveMediaMessage(
								extractMediaData,
								path.join(__dirname, `Temporary Files/${filename}.${extractMediaData.mimetype.split("/")[1]}`),
								"videoMessage",
							);
							const fileSize = getFilesize(video);
							const stringDeleted = `\`\`\`Message Deleted\n\`\`\`
Name : ${pushname}			
Type : ${type}
Time : ${moment.unix(timeStamp).format("HH:mm:ss DD/MM/YYYY")}
Size : ${fileSize}
Caption : ${body ? body : "Unknown"}${quotedMessage}
`.trim();
							await client[botNum].sendMessage(from, { video: readBuffer(video), caption: stringDeleted, mention: options.contextInfo.mentionedJid }, options);
							unlinkFile(video);
						}
						break;
					case "audioMessage":
						{
							const audio = await client[botNum].downloadAndSaveMediaMessage(
								extractMediaData,
								path.join(__dirname, `Temporary Files/${filename}.${extractMediaData.mimetype.split("/")[1]}`),
								"audioMessage",
							);
							const fileSize = getFilesize(audio);
							const stringDeleted = `\`\`\`Message Deleted\n\`\`\`
Name : ${pushname}			
Type : ${type}
Time : ${moment.unix(timeStamp).format("HH:mm:ss DD/MM/YYYY")}
Audio Type : ${extractMediaData.ptt ? "Voice Note" : "Audio File"}
Mimetype : ${extractMediaData.mimetype}
Size : ${fileSize}${quotedMessage}${quotedMessage}
`.trim();
							await client[botNum].sendMessage(from, { audio: readBuffer(audio) }, options).then(() => client[botNum].sendMessage(from, { text: stringDeleted }, options));
							unlinkFile(audio);
						}
						break;
					case "contactMessage":
						{
							const stringDeleted = `\`\`\`Message Deleted\n\`\`\`
Name : ${pushname}			
Type : ${type}
Time : ${moment.unix(timeStamp).format("HH:mm:ss DD/MM/YYYY")}
Displayname : ${extractMediaData.displayName}${quotedMessage}
`.trim();
							await client[botNum]
								.sendMessage(from, { contacts: { displayName: extractMediaData.displayName, contacts: [{ vcard: extractMediaData.vcard }] } }, options)
								.then(() => client[botNum].sendMessage(from, { text: stringDeleted }, options));
						}
						break;
					case "contactsArrayMessage":
						{
							const stringDeleted = `\`\`\`Message Deleted\n\`\`\`
Name : ${pushname}
Type : ${type}
Time : ${moment.unix(timeStamp).format("HH:mm:ss DD/MM/YYYY")}
Displayname :
${extractMediaData.contacts.map((v, i) => `${i + 1}. ${v.displayName}`).join("\n")}${quotedMessage}
`.trim();
							await client[botNum]
								.sendMessage(from, { contacts: { displayName: extractMediaData.displayName, contacts: extractMediaData.contacts } }, options)
								.then(() => client[botNum].sendMessage(from, { text: stringDeleted }, options));
						}
						break;
					case "locationMessage":
					case "liveLocationMessage":
						{
							const string_deleted = `\`\`\`Message Deleted\n\`\`\`
Name : ${pushname}			
Type : ${type}
Time : ${moment.unix(timeStamp).format("HH:mm:ss DD/MM/YYYY")}
Lat : ${extractMediaData.degreesLatitude}
Long : ${extractMediaData.degreesLongitude}${quotedMessage}
`.trim();
							await client[botNum]
								.sendMessage(
									from,
									{
										location: {
											degreesLatitude: extractMediaData.degreesLatitude,
											degreesLongitude: extractMediaData.degreesLongitude,
											jpegThumbnail: extractMediaData.jpegThumbnail,
											name: "Provided by Nanda, Void Bot. Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪",
										},
									},
									options,
								)
								.then(() => client[botNum].sendMessage(from, { text: string_deleted }, options));
						}
						break;
				}
			}
		} catch (err) {
			log(err);
		}
	},
};
