/* global botNum */
import dayjs from 'dayjs';

const cache = new Map();

export default {
	name: 'nowhatsapp',
	description: 'Check if the number is exist or not.',
	usage: '!nowhatsapp 628952253440x',
	aliases: ['nowa'],
	category: 'Helper',
	cooldown: 6,
	limit: 5,
	status: 'enable',
	run: async ({ query, from, message }, client) => {
		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'You must provide a number.');
		}

		if (!/^[0-9xX]*$/.test(query)) {
			return await client[botNum].reply({ from, quoted: message }, 'You must provide only number.');
		}

		const regex = /[xX]/g;

		if (!regex.test(query)) {
			return await client[botNum].reply({ from, quoted: message }, 'You must include "x" in your query.');
		}

		const total = 10 ** query.match(regex).length;

		if (total > 100) {
			return await client[botNum].reply({ from, quoted: message }, 'Too much "x" in your query.');
		}

		const container = cache.get(query) || [];

		if (container.length === 0) {
			for (let i = 0; i < total; i++) {
				const number = `${query.replace(regex, '') + i}@s.whatsapp.net`;
				const status = await client[botNum].onWhatsApp(number);

				if (status[0]?.exists) {
					const biograph = await client[botNum].fetchStatus(number).catch(() => ({ status: 'No Status' }));

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
	existedNumber?.length === 0
		? 'No Data'
		: existedNumber
				.map(
					(v, i) =>
						`${i + 1}. @${v.jid.split('@')[0]}\nBiograph : ${v.info}${
							v.info ? `\nSet On : ${dayjs(v.setAt).format('HH:mm:ss DD/MM/YYYY')}` : ''
						}`,
				)
				.join('\n\n')
}`;
		text += `\n\n${'Unregistered'.formatHeaders()}

${container
	.filter((v) => !v.isExists)
	.map((v) => v.jid.split('@')[0])
	.join('\n')}`;

		client[botNum].sendMessage(from, { text, mentions: existedNumber.map((v) => v.jid) });

		cache.set(query, container);
	},
};
