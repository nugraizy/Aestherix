import fetch from "node-fetch";

export async function getSurahDetail(nomor) {
	return new Promise(async (resolve, reject) => {
		try {
			const data = await fetch(`${URL_BASE}/surat/${nomor}`).then((res) => res.json());
			resolve({
				namaArab: data.nama,
				namaLatin: data.nama_latin,
				nomor: data.nomor,
				totAyat: data.jumlah_ayat,
				turun: data.tempat_turun,
				arti: data.arti,
				deskripsi: data.deskripsi.replace(regex, ""),
			});
		} catch (err) {
			reject({ error: err });
		}
	});
}

const URL_BASE = "https://equran.id/api";
const regex = new RegExp("(</?i>|</?br>)", "g");
