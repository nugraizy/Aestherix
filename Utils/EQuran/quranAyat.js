import { fetchJSON } from '../../Helper/index.js';

const URL_BASE = 'https://equran.id/api';
const regex = new RegExp('(</?u>|</?strong>)', 'g');

export const getAyat = (nomor) =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await fetchJSON(`${URL_BASE}/surat/${nomor}`);

			resolve(data.ayat.map((v) => ({ arab: v.ar, indonesia: v.idn, latin: v.tr.replace(regex, '') })));
		} catch (err) {
			reject(err);
		}
	});
