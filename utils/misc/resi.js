import axios from 'axios';
import FormData from 'form-data';

export const resi = (kurir, resi) =>
	new Promise(async (resolve, reject) => {
		try {
			const { headers } = await axios.get('https://pluginongkoskirim.com/cek-resi/');
			const cookie = headers['set-cookie'].toString().replace('; path=/', '');
			const form = new FormData();

			form.append('kurir', kurir);
			form.append('resi', resi);
			const { data } = await axios({
				url: 'https://pluginongkoskirim.com/cek-tarif-ongkir/front/resi-amp?__amp_source_origin=https://pluginongkoskirim.com',
				method: 'post',
				headers: {
					Accept: '*/*',
					'Accept-Language': 'en-US,en;q=0.9',
					'User-Agent': 'GoogleBot',
					cookie,
					...form.getHeaders(),
				},
				data: form.getBuffer(),
			});

			resolve(data);
		} catch (err) {
			reject(err);
		}
	});
