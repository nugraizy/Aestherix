import Axios from "axios";

export function searchHashtag(query) {
	return new Promise((resolve, reject) => {
		Axios.get(`https://www.instagram.com/explore/tags/${query}/?__a=1`)
			.then(({ data }) => {
				const result = [];
				const data_node = data.graphql.hashtag.edge_hashtag_to_media.edges;
				for (let i = 0; i < data_node.length; i++) {
					const caption = data_node[i].node.edge_media_to_caption.edges[0].node.text;
					const link_post = `https://www.instagram.com/p/${data_node[i].node.shortcode}`;
					const image = data_node[i].node.display_url;
					const timestamp = data_node[i].node.taken_at_timestamp;
					const owner_id = data_node[i].node.owner.id;
					const likes = data_node[i].node.edge_liked_by.count;
					const comments = data_node[i].node.edge_media_to_comment.count;
					result.push({
						owner_id,
						link_post,
						image,
						timestamp,
						likes,
						caption,
						comments,
					});
					resolve(result);
				}
			})
			.catch((_) => reject({ error: _ }));
	});
}
