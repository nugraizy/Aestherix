import { fetchJSON } from '../modules/index.js';

const _api = (input) => `https://equran.id/api/surat/${input}`;
const regex = new RegExp('(</?i>|</?br>)', 'g');

export const getSurahDetail = (nomor) =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await fetchJSON(_api(nomor));

			resolve({
				namaArab: data.nama,
				namaLatin: data.nama_latin,
				nomor: data.nomor,
				totAyat: data.jumlah_ayat,
				turun: data.tempat_turun,
				arti: data.arti,
				deskripsi: data.deskripsi.replace(regex, '')
			});
		} catch (err) {
			reject(err);
		}
	});
