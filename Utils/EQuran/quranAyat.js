import fetch from "node-fetch";

export async function getAyat(nomor) {
	return new Promise(async (resolve, reject) => {
		try {
			const data = await fetch(`${URL_BASE}/surat/${nomor}`).then((res) => res.json());
			resolve(data.ayat.map((v) => ({ arab: v.ar, indonesia: v.idn, latin: v.tr.replace(regex, "") })));
		} catch (err) {
			reject({ error: err });
		}
	});
}

const URL_BASE = "https://equran.id/api";
const regex = new RegExp("(</?u>|</?strong>)", "g");
