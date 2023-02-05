/* global botNum */
import { handlers } from '../../utils/anonymous/index.js';

export default {
	async handler({ from, type, body, isGroup }, client) {
		if (isGroup) {
			return;
		}

		const status = handlers(from);

		if (typeof status === 'boolean') {
			return;
		}

		if ((type === 'conversation' || type === 'extendedTextMessage') && status.partner2) {
			return await client[botNum].sendMessage(status.partner2, { text: body });
		}
	},
};
