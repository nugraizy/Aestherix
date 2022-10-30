/* global botNum */
import configuration from '../../connect.js';
import { reassign, Attachment } from '../../helper/index.js';

const EVENT_UPDATE = {
	GROUP_PARTICIPANT_LEAVE: 'Member Leave',
	GROUP_PARTICIPANT_INVITE: 'Invited Member',
	GROUP_PARTICIPANT_REMOVE: 'Removed Member',
	GROUP_PARTICIPANT_ADD: 'Added Member',
	GROUP_PARTICIPANT_PROMOTE: 'Promoted Member',
	GROUP_PARTICIPANT_DEMOTE: 'Demoted Admin',
	ADD: 'Adding',
	REMOVE: 'Removing',
	PROMOTE: 'Promoting',
	DEMOTE: 'Demoting',
	LEAVE: 'Left',
};

export default {
	async handler(client, message, store) {
		message = await reassign(JSON.parse(JSON.stringify(message)), client, store, false);

		if (Object.keys(EVENT_UPDATE).includes(message.messageStubType) && configuration.cache.metadata.has(message.from)) {
			const cache = configuration.cache.metadata.get(message.from);
			const index = (arr, id, obj) => arr.findIndex((v) => (obj ? v.id === id : v === id));

			if ([EVENT_UPDATE.GROUP_PARTICIPANT_ADD, EVENT_UPDATE.GROUP_PARTICIPANT_INVITE].includes(message.messageStubParameters)) {
				for (const id of message.messageStubParameters) {
					cache.participants.push({
						id,
						admin: null,
					});
					cache.rawParticipants.push({ id, admin: null });
					cache.participantsGroups.push(id);
				}
			} else if ([EVENT_UPDATE.GROUP_PARTICIPANT_LEAVE, EVENT_UPDATE.GROUP_PARTICIPANT_REMOVE].includes(message.messageStubType)) {
				for (const id of message.messageStubParameters) {
					if (cache.adminGroups.includes(id)) {
						cache.adminGroups.splice(index(cache.adminGroups, id, false), 1);
					}

					cache.participants.splice(index(cache.participants, id, true), 1);
					cache.rawParticipants.splice(index(cache.rawParticipants, id, true), 1);
					cache.participantsGroups.splice(index(cache.participantsGroups, id, false), 1);
				}
			} else if (EVENT_UPDATE.GROUP_PARTICIPANT_DEMOTE.includes(message.messageStubType)) {
				for (const id of message.messageStubParameters) {
					cache.participants[index(cache.participants, id, true)].admin = null;
					cache.rawParticipants[index(cache.rawParticipants, id, true)].admin = null;
				}
			} else if (EVENT_UPDATE.GROUP_PARTICIPANT_PROMOTE.includes(message.messageStubType)) {
				for (const id of message.messageStubParameters) {
					cache.participants[index(cache.participants, id, true)].admin = 'admin';
					cache.rawParticipants[index(cache.rawParticipants, id, true)].admin = 'admin';
				}
			}
		}

		if (message?.[message.from]?.notification == 'enable') {
			const text = `\`\`\` • Group Participants Notification\`\`\`\n
Event Update : ${EVENT_UPDATE[message.messageStubType]}

@${message.participant.split('@')[0]} ${EVENT_UPDATE[message.messageStubType.split('_').reverse()[0]]} ${
				message.messageStubType.split('_').reverse()[0] !== 'LEAVE' ? message.messageStubParameters.map((v) => `@${v.split('@')[0]}`).join(', ') : ''
			}`;

			if (['GROUP_PARTICIPANT_LEAVE', 'GROUP_PARTICIPANT_REMOVE', 'GROUP_PARTICIPANT_INVITE', 'GROUP_PARTICIPANT_ADD'].includes(message.messageStubType)) {
				if (message.messageStubParameters.length == 1) {
					const attach = new Attachment(1024, 500);
					const profile = await client[botNum].profilePictureUrl(message.messageStubParameters[0], 'image').catch(() => './media_files/blank.png');

					(await attach.fillBackground().appendImage(profile, { stroke: true, strokeWidth: 9, strokeColor: attach.PALETTES.RED, roundedRadius: 70 })).appendText(
						['GROUP_PARTICIPANT_LEAVE'].includes(message.messageStubType)
							? 'Leaving the group'
							: ['GROUP_PARTICIPANT_REMOVE'].includes(message.messageStubType)
							? 'Kicked from the group'
							: 'Welcome to',
						message.messageStubParameters[0].split('@')[0],
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
						image: new Buffer.from(attach.toBuffer(), 'base64'),
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
