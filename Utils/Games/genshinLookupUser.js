import { getServer, request } from "./genshinUtils.js";

export const genshinProfile = (uid) =>
	new Promise(async (resolve, reject) => {
		try {
			const { completeServer, simplifiedServer } = getServer(uid);
			const { data } = await request(
				"get",
				"index",
				{
					role_id: uid,
					server: completeServer,
				},
				simplifiedServer,
			);
			resolve(data);
		} catch (err) {
			log(err);
			reject(err);
		}
	});
