import { fetchJSON } from '../modules/index.js';
import { getAyat } from './index.js';

const _api = (input) => `https://equran.id/api/tafsir/${input}`;

export const getTafsirSurah = (nomor) =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await fetchJSON(_api(nomor));
			const ayat = await getAyat(nomor);

			resolve(
				data.tafsir.map((v, i) => ({
					arab: ayat[i].arab,
					indonesia: ayat[i].indonesia,
					latin: ayat[i].latin,
					tafsir: v.tafsir
				}))
			);
		} catch (err) {
			reject(err);
		}
	});
