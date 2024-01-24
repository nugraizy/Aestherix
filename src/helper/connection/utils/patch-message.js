const {
	default: { proto: Proto }
} = await import('@adiwajshing/baileys');
/**
 * @type {import('@adiwajshing/baileys').proto} proto
 */
const proto = Proto;

export const patchInteractiveMessage = (message) => {
	if (message?.deviceSentMessage?.message?.listMessage) {
		message = JSON.parse(JSON.stringify(message));

		message.deviceSentMessage.message.listMessage.listType = proto.Message.ListMessage.ListType.SINGLE_SELECT;
	}

	if (message?.listMessage) {
		message = JSON.parse(JSON.stringify(message));

		message.listMessage.listType = proto.Message.ListMessage.ListType.SINGLE_SELECT;
	}

	return message;
};
