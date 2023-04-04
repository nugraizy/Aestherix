import { getServer, request } from './genshin-utils.js';

export const genshinProfile = (uid) =>
	new Promise(async (resolve, reject) => {
		try {
			const { completeServer, simplifiedServer } = getServer(uid);
			const { data } = await request(
				'get',
				'index',
				{
					/* eslint-disable-line */ role_id: uid,
					server: completeServer
				},
				simplifiedServer
			);

			resolve(data);
		} catch (err) {
			log(err);
			reject(err);
		}
	});
