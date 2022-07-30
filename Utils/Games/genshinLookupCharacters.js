import { getServer, request } from "./genshinUtils.js";
import { genshinProfile } from "./genshinLookupUser.js";

export const getCharacters = async (uid) => {
	const { completeServer, simplifiedServer } = getServer(uid);
	const userInfo = await genshinProfile(uid);
	const charIds = userInfo.avatars.map((v) => {
		return v.id;
	});
	return (
		await request(
			"post",
			"character",
			{
				character_ids: charIds,
				server: completeServer,
				role_id: uid,
			},
			simplifiedServer,
		)
	).data.avatars;
};
