import dayjs from 'dayjs';

import { Prettify } from '../../helper/index.js';
import { color, INFOLOG, ERRLOG } from '../../utils/modules/index.js';

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'carbon',
	description: 'Prettify code.',
	usage: '!carbon <reply/send image>',
	aliases: ['carbon'],
	category: 'Converter',
	cooldown: 5,
	limit: 4,
	status: 'enable',
	run: async ({ from, prettyNumber, message, query, groupMetadata }, client) => {
		const time = dayjs().format('HH:mm:ss DD/MM');

		if (!query) {
			return client[botNum].reply({ groupMetadata, from, quoted: message }, 'Please provide a Codes.');
		}

		INFOLOG(`[${color(time, 'cyan')}]`, `${color('Carboning a Codes', '#01cdfe')} ${color(prettyNumber, '#ff71ce')}`);

		const carbon = await new Prettify().Carbon(query, { theme: 'dracula' });

		let buffer = carbon.toBuffer();

		if ('error' in buffer) {
			client[botNum].reply({ from, quoted: message }, buffer.error);
			ERRLOG(
				`[${color(time, 'cyan')}]`,
				`⚠️ ${color('Failed to Carboning a Codes', 'red')} for ${color(prettyNumber, '#ff71ce')}`
			);
			return;
		}

		await client[botNum].send(from, { image: Buffer.from(buffer, 'base64') }, { groupMetadata, quoted: message });
		buffer = null;

		INFOLOG(`[${color(time, 'cyan')}]`, `${color('Carboning a Codes Success', '#01cdfe')} ${color(prettyNumber, '#ff71ce')}`);
	}
};
