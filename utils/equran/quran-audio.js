import { fetchBUFFER, fetchJSON } from '../../helper/index.js';

const _api = (input) => `https://equran.id/api/surat/${input}`;

export const getSurahAudio = (nomor) =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await fetchJSON(_api(nomor));

			resolve({
				url: data.audio,
				buffer: Buffer.from(await fetchBUFFER(data.audio)),
			});
		} catch (err) {
			reject(err);
		}
	});
