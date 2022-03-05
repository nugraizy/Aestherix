import { handlers } from "../../Utils/Anonymous/index.js";

export default {
	async handler({ from, type, body }, client) {
		const status = handlers(from);
		if (typeof status == "boolean") return;
		if (type == "conversation" || type == "extendedTextMessage") return client[botNum].sendMessage(status.partner2, { text: body });
	},
};
