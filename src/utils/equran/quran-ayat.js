import { fetchJSON } from '../modules/index.js';

const _api = (input) => `https://equran.id/api/surat/${input}`;
const regex = new RegExp('(</?u>|</?strong>)', 'g');

export const getAyat = (nomor) =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await fetchJSON(_api(nomor));

			resolve(data.ayat.map((v) => ({ arab: v.ar, indonesia: v.idn, latin: v.tr.replace(regex, '') })));
		} catch (err) {
			reject(err);
		}
	});
