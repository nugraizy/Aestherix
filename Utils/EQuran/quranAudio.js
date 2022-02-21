import fetch from "node-fetch";

export const getSurahAudio = (nomor) =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await fetch(`${URL_BASE}/surat/${nomor}`).then((res) => res.json());
			resolve({
				url: data.audio,
				buffer: Buffer.from(await fetch(data.audio).then((res) => res.arrayBuffer())),
			});
		} catch (err) {
			reject({ error: err });
		}
	});

const URL_BASE = "https://equran.id/api";
