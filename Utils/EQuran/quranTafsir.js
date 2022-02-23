import fetch from "node-fetch";
import { getAyat } from "./index.js";

export const getTafsirSurah = (nomor) =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await fetch(`${URL_BASE}/tafsir/${nomor}`).then((res) => res.json());
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
			reject({ error: err });
		}
	});

const URL_BASE = "https://equran.id/api";
