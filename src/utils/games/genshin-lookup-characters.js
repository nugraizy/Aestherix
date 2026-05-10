import { genshinProfile } from './genshin-lookup-user.js';
import { getServer, request } from './genshin-utils.js';

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
				character_ids: charIds,
				server: completeServer,
				role_id: uid
			},
			simplifiedServer
		)
	).data.avatars;
};
