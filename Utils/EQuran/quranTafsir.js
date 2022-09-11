import { fetchJSON } from '../../Helper/index.js';
import { getAyat } from './index.js';

const URL_BASE = 'https://equran.id/api';

export const getTafsirSurah = (nomor) =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await fetchJSON(`${URL_BASE}/tafsir/${nomor}`);
			const ayat = await getAyat(nomor);

			resolve(
				data.tafsir.map((v, i) => ({
					arab: ayat[i].arab,
					indonesia: ayat[i].indonesia,
					latin: ayat[i].latin,
					tafsir: v.tafsir,
				})),
			);
		} catch (err) {
			reject(err);
		}
	});
