import { delay } from 'baileys';

import configuration from '../../helper/config/connect.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps['run']}
 */
const handler = async ({ from, type, body, message, mediaData, isFromMe }, client) => {
	try {
		/**
		 * @type {import('../../utils/ai/char-ai.js').ChatGPTDialogue}
		 */
		const ai = configuration.charAI.get(from);

		if (ai && !isFromMe && (type === 'conversation' || type === 'extendedTextMessage' || type === 'imageMessage')) {
			body = type === 'imageMessage' ? await client.downloadMediaMessage(mediaData) : body;
			let response = await ai.sendMessage(body);

			if (response.error) {
				await client.reply(from, response.message, message);

				response = await ai.sendMessage(body);

				await delay(1000);
			}

			response = response.message.split('{OTHER_MESSAGE}');

			for (const aiMessage of response) {
				await client.reply(from, aiMessage.trim(), message);

				await delay(1000);
			}
		}
	} catch (error) {
		console.log(error);
	}
};

const aiHandler = handler;

export default aiHandler;
