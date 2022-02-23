import path from "path";
import moment from "moment-timezone";
import Timeout from "smart-timeout";
import { __dirname } from "../../connect.js";
import { createExif } from "../../Utils/Misc/index.js";
import { convertMediaToSticker } from "../../Utils/Converter/index.js";
import { getFilesize, readBuffer, unlinkFile, readJSON, writeJSON } from "../../Helper/Modules/index.js";
import { reassign } from "../../Helper/Modules/reassignMessagesObject.js";

export default {
	async handler(client, message) {
		try {
			const data = readJSON(path.join(__dirname, "Databases/Groups/settingsManager.json"));
			if (message == undefined) return;
			message = await reassign(JSON.parse(JSON.stringify(message)), client);
			if ("error" in message) return;
			const {
				from,
				mention: mentioning,
				timeStamp,
				sender,
				message: { message: messages },
				body,
				pushname,
				extractMediaData,
				filename,
				prettyNumber,
				isBaileys,
				isFromMe,
			} = message;
			const type = Object.keys(messages)[0];

			if (!messages) return;
			if (isBaileys) return;
			if (isFromMe) return;
			if (from == "status@broadcast") return;
			if (type == "protocolMessage" || type == "senderKeyDistributionMessage" || !type) return;
			if (data[data.findIndex((v) => Object.keys(v)[0] == from)].URLSender.some((v) => v.sender == sender && v.id == message.message.key.id) && Timeout.exists(sender)) {
				Timeout.clear(sender);
				await client[botNum].reply(from, "Good. Do not send URLs next time or i will kick you.");
				data[data.findIndex((v) => Object.keys(v)[0] == from)][from].URLSender.splice(
					data[data.findIndex((v) => Object.keys(v)[0] == from)][from].URLSender.findIndex((v) => v.sender == sender && v.id == message.message.key.id),
					1,
				);
				writeJSON(path.join(__dirname, "Databases/Groups/settingsManager.json"), data);
				return;
			}
			if (message[from].antiDelete == "enable") {
				const options = {
					quoted: message.message,
					contextInfo: {
						mentionedJid: [],
					},
				};

				const mentioningReply = messages[type].contextInfo && messages[type].contextInfo.participant ? messages[type].contextInfo.participant.toString() : "";
				const replyParticipants = messages[type].contextInfo && messages[type].contextInfo.participant ? messages[type].contextInfo.participant.split("@")[0] : "";
				options.contextInfo.mentionedJid.push(sender, mentioning, mentioningReply);

				let typeQuoted = null;
				const captionReply = `\nMessage Replied to : ${replyParticipants}\n`;
				const quotedMessage =
					Object.keys(messages)[0] == type && messages[type].contextInfo && messages[type].contextInfo.quotedMessage && (typeQuoted = Object.keys(messages[type].contextInfo.quotedMessage)[0])
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
									? `${captionReply}Type : ${typeQuoted}\nTotal Contact : ${messages[type].contextInfo.quotedMessage.contactsArrayMessage.contacts.length}\nList Name :\n${messages[type].contextInfo.quotedMessage.contactsArrayMessage.contacts.map((arr) => arr.displayName).join("\n")}`
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
							client[botNum].sendMessage(from, { text: stringDeleted, contextInfo: { mentionedJid: options.contextInfo.mentionedJid } }, options);
						}
						break;
					case "stickerMessage":
						{
							const file = await client[botNum].downloadAndSaveMediaMessage(extractMediaData, path.join(__dirname, `Temporary Files/${filename}.${extractMediaData.mimetype.split("/")[1]}`));
							createExif("Made by Nanda", "Void bot");
							const fileSize = getFilesize(file);
							const sticker = await convertMediaToSticker(file, prettyNumber);
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
							const image = await client[botNum].downloadAndSaveMediaMessage(extractMediaData, path.join(__dirname, `Temporary Files/${filename}.${extractMediaData.mimetype.split("/")[1]}`));
							const fileSize = getFilesize(image);
							const stringDeleted = `\`\`\`Message Deleted\n\`\`\`
Name : ${pushname}			
Type : ${type}
Time : ${moment.unix(timeStamp).format("HH:mm:ss DD/MM/YYYY")}
Size : ${fileSize}
Caption : ${body ? body : "Unknown"}${quotedMessage}
`.trim();
							await client[botNum].sendMessage(from, { image: readBuffer(image), caption: stringDeleted, contextInfo: { mentionedJid: options.contextInfo.mentionedJid } }, options);
							unlinkFile(image);
						}
						break;
					case "videoMessage":
						{
							const video = await client[botNum].downloadAndSaveMediaMessage(extractMediaData, path.join(__dirname, `Temporary Files/${filename}.${extractMediaData.mimetype.split("/")[1]}`));
							const fileSize = getFilesize(video);
							const stringDeleted = `\`\`\`Message Deleted\n\`\`\`
Name : ${pushname}			
Type : ${type}
Time : ${moment.unix(timeStamp).format("HH:mm:ss DD/MM/YYYY")}
Size : ${fileSize}
Caption : ${body ? body : "Unknown"}${quotedMessage}
`.trim();
							await client[botNum].sendMessage(from, { video: readBuffer(video), caption: stringDeleted, contextInfo: { mentionedJid: options.contextInfo.mentionedJid } }, options);
							unlinkFile(video);
						}
						break;
					case "audioMessage":
						{
							const audio = await client[botNum].downloadAndSaveMediaMessage(extractMediaData, path.join(__dirname, `Temporary Files/${filename}.${extractMediaData.mimetype.split("/")[1]}`));
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
							await client[botNum].sendMessage(from, { contacts: { displayName: extractMediaData.displayName, contacts: [{ vcard: extractMediaData.vcard }] } }, options).then(() => client[botNum].sendMessage(from, { text: stringDeleted }, options));
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
							await client[botNum].sendMessage(from, { contacts: { displayName: extractMediaData.displayName, contacts: extractMediaData.contacts } }, options).then(() => client[botNum].sendMessage(from, { text: stringDeleted }, options));
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
								.sendMessage(from, { location: { degreesLatitude: extractMediaData.degreesLatitude, degreesLongitude: extractMediaData.degreesLongitude, jpegThumbnail: extractMediaData.jpegThumbnail, name: "Provided by Nanda, From Void Bot." } }, options)
								.then(() => client[botNum].sendMessage(from, { text: string_deleted }, options));
						}
						break;
				}
			}
		} catch (err) {
			console.log(err);
		}
	},
};
