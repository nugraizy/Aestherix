import dayjs from 'dayjs';

import { Cache } from '../../helper/modules/cache.js';

const cache = new Cache();

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'nowhatsapp',
	minifiedDescription: 'Check WhatsApp Number',
	description: 'Check if the number is exist or not.',
	usage: '!nowhatsapp `<628952253440x>`',
	aliases: ['nowa'],
	category: 'Helper',
	cooldown: 6,
	limit: 5,
	status: 'enable',
	run: async ({ query, from, message }, client) => {
		if (!query) {
			return await client.instance.reply(from, 'You must provide a number.', message);
		}

		if (!/^[0-9xX]*$/.test(query)) {
			return await client.instance.reply(from, 'You must provide only number.', message);
		}

		const regex = /[xX]/g;

		if (!regex.test(query)) {
			return await client.instance.reply(from, 'You must include "x" in your query.', message);
		}

		const total = 10 ** query.match(regex).length;

		if (total > 100) {
			return await client.instance.reply(from, 'Too much "x" in your query.', message);
		}

		const container = cache.get(query) || [];

		if (!container.length) {
			for (let i = 0; i < total; i++) {
				const number = `${query.replace(regex, '') + i}@s.whatsapp.net`;
				const status = await client.instance.onWhatsApp(number);

				if (status[0]?.exists) {
					const biograph = await client.instance.fetchStatus(number).catch(() => ({ status: 'No Status' }));

					container.push({ jid: number, isExists: true, info: biograph.status, setAt: biograph?.setAt });
					continue;
				}

				container.push({ jid: number, isExists: false });
			}
		}

		const existedNumber = container.filter((v) => v.isExists);
		let text = `${'WhatsApp Number Checker'.formatHeaders()}\n\n`;

		text += `${'Registered'.formatHeaders()}

${
	existedNumber?.length
		? existedNumber
				.map(
					(v, i) =>
						`${i + 1}. @${v.jid.split('@')[0]}\nBiograph : ${v.info}${
							v.info ? `\nSet On : ${dayjs(v.setAt).format('HH:mm:ss DD/MM/YYYY')}` : ''
						}`
				)
				.join('\n\n')
		: 'No Data'
}`;
		text += `\n\n${'Unregistered'.formatHeaders()}

${container
	.filter((v) => !v.isExists)
	.map((v) => v.jid.split('@')[0])
	.join('\n')}`;

		await client.instance.send(from, { text, mentions: existedNumber.map((v) => v.jid) }, {});

		cache.set(query, container);
	}
};
