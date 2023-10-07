import { handlers } from '../../utils/anonymous/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps['run']}
 */
const handler = async ({ from, type, body, isGroup }, client) => {
	if (!isGroup) {
		const status = handlers(from);

		if (typeof status !== 'boolean' && (type === 'conversation' || type === 'extendedTextMessage') && status.partner2) {
			await client[botNum].send(status.partner2, { text: body });
		}
	}
};

const anonymousHandler = handler;

export default anonymousHandler;
