const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36";
const sessionId = process.env.INSTAGRAM_SESI || (await (await import("./instaCookie.js")).getCookie(process.env.INSTAGRAM_USERNAME, process.env.INSTAGRAM_PASSWORD));

export const searchHashtag = (query) =>
	new Promise(async (resolve, reject) => {
		try {
			if (query.includes("#")) query = query.replace("#", "");
			const response = await fetchJSON(`https://www.instagram.com/explore/tags/${query}/?__a=1&__d=dis`, {
				headers: {
					"user-agent": UA,
					cookie: sessionId,
				},
			});
			const result = [];
			const dataNode = response.graphql.hashtag.edge_hashtag_to_media.edges;
			for (const data of dataNode) {
				const caption = data?.node?.edge_media_to_caption.edges[0]?.node?.text ?? "No Caption";
				const link_post = `https://www.instagram.com/p/${data?.node?.shortcode ?? "No Link"}`;
				const image = data?.node?.display_url ?? "No Image";
				const timestamp = data?.node?.taken_at_timestamp ?? "No Timestamp";
				const owner_id = data?.node?.owner?.id ?? "No Owner ID";
				const likes = data?.node?.edge_liked_by?.count ?? "No Likes";
				const comments = data?.node?.edge_media_to_comment?.count ?? "No Comments";
				result.push({
					owner_id,
					link_post,
					image,
					timestamp,
					likes,
					caption,
					comments,
				});
			}
			resolve(result);
		} catch (e) {
			log(e);
			reject({ error: e });
		}
	});
