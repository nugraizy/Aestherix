import Axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const TOKEN = process.env.PEXEL_TOKEN;
const URL_API = 'https://api.pexels.com/v1/search';

export const stockImagesPexel = (query) =>
	new Promise(async (resolve, reject) => {
		try {
			const { data } = await Axios.get(URL_API, {
				params: {
					query,
					size: 'large',
					per_page: 80 /* eslint-disable-line */,
				},
				headers: {
					Authorization: TOKEN,
				},
			});

			resolve(data?.photos?.map((v) => v.src.original));
		} catch (err) {
			reject(err);
		}
	});
