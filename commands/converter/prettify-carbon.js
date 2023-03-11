/* global botNum */
import dayjs from 'dayjs';

import { Prettify } from '../../helper/index.js';
import { color, INFOLOG, ERRLOG } from '../../helper/modules/index.js';

export default {
	name: 'carbon',
	description: 'Prettify code.',
	usage: '!carbon <reply/send image>',
	aliases: ['carbon'],
	category: 'Converter',
	cooldown: 5,
	limit: 4,
	status: 'enable',
	run: async ({ from, prettyNumber, message, query }, client) => {
		const time = dayjs().format('HH:mm:ss DD/MM');

		if (!query) {
			return client[botNum].reply({ from, quoted: message }, 'Please provide a Codes.');
		}

		INFOLOG(`[${color(time, 'cyan')}]`, `${color('Carboning a Codes', '#01cdfe')} ${color(prettyNumber, '#ff71ce')}`);

		let buffer = await new Prettify().Carbon(query, { theme: 'dracula' });

		buffer = buffer.toBuffer();

		if ('error' in buffer) {
			client[botNum].reply({ from, quoted: message }, buffer.error);
			ERRLOG(
				`[${color(time, 'cyan')}]`,
				`⚠️ ${color('Failed to Carboning a Codes', 'red')} for ${color(prettyNumber, '#ff71ce')}`,
			);
			return;
		}

		await client[botNum].sendMessage(from, { image: Buffer.from(buffer, 'base64') }, { quoted: message });
		buffer = null;

		INFOLOG(`[${color(time, 'cyan')}]`, `${color('Carboning a Codes Success', '#01cdfe')} ${color(prettyNumber, '#ff71ce')}`);
	},
};
