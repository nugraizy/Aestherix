import fetch from "node-fetch";

export async function getListSurah() {
	return new Promise(async (resolve, reject) => {
		try {
			const data = await fetch(`${URL_BASE}/surat`).then((res) => res.json());
			resolve(data);
		} catch (err) {
			reject({ error: err });
		}
	});
}

const URL_BASE = "https://equran.id/api";
