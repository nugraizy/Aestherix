import { delay } from 'baileys';

import configuration from '../../helper/config/connect.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps['run']}
 */
const handler = async ({ from, type, body, message, mediaData }, client) => {
	try {
		/**
		 * @type {import('../../utils/ai/char-ai.js').ChatGPTDialogue}
		 */
		const ai = configuration.user.charAI.get(from);

		if (ai && (type === 'conversation' || type === 'extendedTextMessage' || type === 'imageMessage')) {
			body = type === 'imageMessage' ? await client.instance.downloadMediaMessage(mediaData) : body;
			let response = await ai.sendMessage(body);

			if (response.error) {
				await client.instance.reply(response.message, { from, quoted: message });

				response = await ai.sendMessage(body);

				await delay(1000);
			}

			await client.instance.reply(response.message, { from, quoted: message });
		}
	} catch (error) {
		console.log(error);
	}
};

const aiHandler = handler;

export default aiHandler;
