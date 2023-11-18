import { delay } from '@adiwajshing/baileys';

import configuration from '../../helper/config/connect.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps['run']}
 */
const handler = async ({ from, type, body, message, groupMetadata }, client) => {
	/**
	 * @type {import('../../utils/ai/char-ai.js').ChatGPTDialogue}
	 */
	const ai = configuration.user.charAI.get(from);

	if (ai && (type === 'conversation' || type === 'extendedTextMessage')) {
		let response = await ai.sendMessage(body);

		if (response.error) {
			await client[botNum].reply(response.message, { from, quoted: message, groupMetadata });

			response = await ai.sendMessage(body);

			await delay(1000);
		}

		await client[botNum].reply(response.message, { from, quoted: message, groupMetadata });
	}
};

const aiHandler = handler;

export default aiHandler;
