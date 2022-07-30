export const getListSurah = () =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await fetchJSON(`${URL_BASE}/surat`);
			resolve(data);
		} catch (err) {
			reject({ error: err });
		}
	});

const URL_BASE = "https://equran.id/api";
