import fetch from "node-fetch";

export const searchHashtag = (query) =>
	new Promise(async (resolve, reject) => {
		try {
			if (query.includes("#")) query = query.replace("#", "");
			const response = await (await fetch(`https://www.instagram.com/explore/tags/${query}/?__a=1`)).json();
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
			console.log(e);
			reject({ error: e });
		}
	});

// benchmark.
// Axios 1.829s, 2.378s, 2.183s, avg. 2.064s
// fetch 1.591s, 2.048s, 1.860s, avg. 1.829s
