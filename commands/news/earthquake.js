/* global botNum */
import { getEarthquake } from '../../utils/index.js';

export default {
	name: 'gempa',
	description: 'Showing latest earthquake in Indonesia',
	category: 'News',
	usage: '!gempa',
	aliases: ['earthquake'],
	cooldown: 2,
	limit: 1,
	status: 'enable',
	async run(message, client) {
		const data = await getEarthquake();

		let caption = 'Latest Earthquake'.formatHeaders();

		for (const res of data) {
			caption += `\n\nTanggal : ${res.date}\n`;
			caption += `Jam : ${res.time}\n`;
			caption += `Koordinat : ${res.coordinates}\n`;
			caption += `Lintang : ${res.latitude}\n`;
			caption += `Bujur : ${res.longitude}\n`;
			caption += `Magnitude : ${res.magnitude}\n`;
			caption += `Kedalaman : ${res.depth}\n`;
			caption += `Wilayah : ${res.region}\n`;

			if (res.feel) {
				caption += `Potensi : ${res.potency}\n`;
				caption += `Dirasakan : ${res.feel}\n\n`;
			} else {
				caption += `Potensi : ${res.potency}\n\n`;
			}
		}

		await client[botNum].sendMessage(message.from, { image: { url: data[0].shakemap }, caption }, { quoted: message.message });
	},
};
