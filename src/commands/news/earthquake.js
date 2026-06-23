import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { getEarthquake } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'gempa',
	minifiedDescription: 'Latest Earthquake',
	description: 'Showing latest earthquake in Indonesia.',
	category: 'News',
	usage: '!gempa',
	aliases: ['earthquake'],
	cooldown: 2,
	limit: 1,
	status: 'enable',
	async run(message, client) {
		const locale = await getLocale(message.from);
		const Ln = useLocale(locale, 'news');

		const data = await getEarthquake();

		let caption = Ln.titles.latestEarthquake.formatHeaders();

		for (const res of data) {
			caption += `\n\n${Ln.labels.tanggal} : ${res.date}\n`;
			caption += `${Ln.labels.jam} : ${res.time}\n`;
			caption += `${Ln.labels.koordinat} : ${res.coordinates}\n`;
			caption += `${Ln.labels.lintang} : ${res.latitude}\n`;
			caption += `${Ln.labels.bujur} : ${res.longitude}\n`;
			caption += `${Ln.labels.magnitude} : ${res.magnitude}\n`;
			caption += `${Ln.labels.kedalaman} : ${res.depth}\n`;
			caption += `${Ln.labels.wilayah} : ${res.region}\n`;

			if (res.feel) {
				caption += `${Ln.labels.potensi} : ${res.potency}\n`;
				caption += `${Ln.labels.dirasakan} : ${res.feel}\n\n`;
			} else {
				caption += `${Ln.labels.potensi} : ${res.potency}\n\n`;
			}
		}

		await client.send(
			message.from,
			{ image: { url: data[0].shakemap }, caption: caption.formatForm() },
			{ quoted: message.message }
		);
	}
});
