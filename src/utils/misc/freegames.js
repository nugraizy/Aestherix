import { fetchJSON } from '../modules/index.js';

export const getNewGames = () =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await fetchJSON('https://www.reddit.com/r/freegames/new.json?sort=new');

			resolve(data.data.children[0].data);
		} catch (error) {
			reject(error);
		}
	});
