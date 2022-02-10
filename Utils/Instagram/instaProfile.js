import dotenv from "dotenv";
dotenv.config();

import Axios from "axios";

const sessionId = process.env.INSTAGRAM_SESI;

export function getUser(username) {
	return new Promise((resolve, reject) => {
		try {
			Axios.get(`https://www.instagram.com/${username}/?__a=1`, {
				headers: {
					Cookie: `sessionid=${sessionId}`,
				},
			})
				.then(({ data }) => {
					const user = data.graphql.user;
					resolve({
						id: user.id,
						biography: user.biography,
						subscribersCount: user.edge_followed_by.count,
						subscribtions: user.edge_follow.count,
						fullName: user.full_name,
						highlightCount: user.highlight_reel_count,
						isBusinessAccount: user.is_business_account,
						isRecentUser: user.is_joined_recently,
						accountCategory: user.business_category_name,
						linkedFacebookPage: user.connected_fb_page,
						isPrivate: user.is_private,
						isVerified: user.is_verified,
						profilePic: user.profile_pic_url,
						profilePicHD: user.profile_pic_url_hd,
						username: user.username,
						postsCount: user.edge_owner_to_timeline_media.count,
						posts:
							user.edge_owner_to_timeline_media.edges.map((edge) => {
								const hasCaption = edge.node.edge_media_to_caption.edges[0];
								return {
									id: edge.node.id,
									shortCode: edge.node.shortcode,
									url: `https://www.instagram.com/p/${edge.node.shortcode}/`,
									dimensions: edge.node.dimensions,
									imageUrl: edge.node.display_url,
									isVideo: edge.node.is_video,
									caption: hasCaption ? hasCaption.node.text : "",
									commentsCount: edge.node.edge_media_to_comment.count,
									commentsDisabled: edge.node.comments_disabled,
									timestamp: edge.node.taken_at_timestamp,
									likesCount: edge.node.edge_liked_by.count,
									location: edge.node.location,
									children: edge.node.edge_sidecar_to_children
										? edge.node.edge_sidecar_to_children.edges.map((edge) => ({
												id: edge.node.id,
												shortCode: edge.node.shortcode,
												dimensions: edge.node.dimensions,
												imageUrl: edge.node.display_url,
												isVideo: edge.node.is_video,
										  }))
										: [],
								};
							}) || [],
					});
				})
				.catch((_) => reject({ error: _ }));
		} catch (e) {
			reject({ error: e });
		}
	});
}
