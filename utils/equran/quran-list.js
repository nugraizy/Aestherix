import { fetchJSON } from '../../helper/index.js';

const _api = 'https://equran.id/api/surat';

export const getListSurah = () =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await fetchJSON(_api);

			resolve(data);
		} catch (err) {
			reject(err);
		}
	});
