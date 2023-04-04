import { handlers } from '../../utils/anonymous/index.js';

const handler = async ({ from, type, body, isGroup }, client) => {
	if (isGroup) {
		return;
	}

	const status = handlers(from);

	if (typeof status === 'boolean') {
		return;
	}

	if ((type === 'conversation' || type === 'extendedTextMessage') && status.partner2) {
		return await client[botNum].send(status.partner2, { text: body });
	}
};

const anonymousHandler = handler;

export default anonymousHandler;
