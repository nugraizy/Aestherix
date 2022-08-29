import { reassign, Attachment } from "../../Helper/index.js";

const EVENT_UPDATE = {
	GROUP_PARTICIPANT_LEAVE: "Member Leave",
	GROUP_PARTICIPANT_INVITE: "Invited Member",
	GROUP_PARTICIPANT_REMOVE: "Removed Member",
	GROUP_PARTICIPANT_ADD: "Added Member",
	GROUP_PARTICIPANT_PROMOTE: "Promoted Member",
	GROUP_PARTICIPANT_DEMOTE: "Demoted Admin",
	ADD: "Adding",
	REMOVE: "Removing",
	PROMOTE: "Promoting",
	DEMOTE: "Demoting",
};

export default {
	async handler(client, message, store) {
		message = await reassign(JSON.parse(JSON.stringify(message)), client, store, false);
		if (message?.[message.from]?.notification == "enable") {
			const text = `\`\`\` • Group Participants Notification\`\`\`\n
Event Update : ${EVENT_UPDATE[message.messageStubType]}

@${message.participant.split("@")[0]} ${EVENT_UPDATE[message.messageStubType.split("_").reverse()[0]]} ${message.messageStubParameters
				.map((v) => `@${v.split("@")[0]}`)
				.join(", ")}`;
			if (["GROUP_PARTICIPANT_LEAVE", "GROUP_PARTICIPANT_REMOVE", "GROUP_PARTICIPANT_INVITE", "GROUP_PARTICIPANT_ADD"].includes(message.messageStubType)) {
				if (message.messageStubParameters.length == 1) {
					const attach = new Attachment(1024, 500);
					const profile = await client[botNum].profilePictureUrl(message.messageStubParameters[0], "image").catch(() => "./Media Files/blank.png");
					(await attach.fillBackground().appendImage(profile, { stroke: true, strokeWidth: 9, strokeColor: attach.PALETTES.RED, roundedRadius: 70 })).appendText(
						["GROUP_PARTICIPANT_LEAVE"].includes(message.messageStubType)
							? "Leaving the group"
							: ["GROUP_PARTICIPANT_REMOVE"].includes(message.messageStubType)
							? "Kicked from the group"
							: "Welcome to",
						message.messageStubParameters[0].split("@")[0],
						message.groupName,
						attach.canvas.width / 2,
						attach.canvas.height / 2,
						{
							fontSize: 62,
							color: attach.PALETTES.GREEN,
							shadow: true,
							participantColor: attach.PALETTES.GREEN,
							groupNameColor: attach.PALETTES.PURPLE,
							textColor: attach.PALETTES.RED,
						},
					);
					await client[botNum].sendMessage(message.from, {
						image: new Buffer.from(attach.toBuffer(), "base64"),
						caption: text,
						mentions: [message.participant, ...message.messageStubParameters],
					});
					return;
				}
			}
			await client[botNum].sendMessage(message.from, {
				text,
				mentions: [message.participant, ...message.messageStubParameters],
			});
		}
	},
};
