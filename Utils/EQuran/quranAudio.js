import { fetchBUFFER, fetchJSON } from "../../Helper/index.js";

export const getSurahAudio = (nomor) =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await fetchJSON(`${URL_BASE}/surat/${nomor}`);
			resolve({
				url: data.audio,
				buffer: Buffer.from(await fetchBUFFER(data.audio)),
			});
		} catch (err) {
			reject(err);
		}
	});

const URL_BASE = "https://equran.id/api";
