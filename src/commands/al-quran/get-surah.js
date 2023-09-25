import { getListSurah } from '../../utils/index.js';

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'getsurah',
	description: 'Get List of Surah from The Quran',
	category: 'AL-Quran',
	usage: '!getsurah',
	aliases: ['surah'],
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, message, groupMetadata }, client) {
		const lists = await getListSurah();

		await client[botNum].reply(
			{ groupMetadata, from, quoted: message },
			lists
				.map(
					(v, i) =>
						`${i + 1}. ${v.nama_latin}\nTot. Ayat : ${v.jumlah_ayat}\nArti : ${v.arti}\nTurun Di : ${
							v.tempat_turun
						}\nAudio : ${v.audio}\n`
				)
				.join('\n')
		);
	}
};
