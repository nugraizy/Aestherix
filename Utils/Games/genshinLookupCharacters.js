import { genshinProfile } from './genshinLookupUser.js';
import { getServer, request } from './genshinUtils.js';

export const getCharacters = async (uid) => {
	const { completeServer, simplifiedServer } = getServer(uid);
	const userInfo = await genshinProfile(uid);
	const charIds = userInfo.avatars.map((v) => {
		return v.id;
	});

	return (
		await request(
			'post',
			'character',
			{
				/* eslint-disable */
				character_ids: charIds,
				server: completeServer,
				role_id: uid,
				/* eslint-enable */
			},
			simplifiedServer,
		)
	).data.avatars;
};
