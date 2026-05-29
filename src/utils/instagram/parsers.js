import { _baseUrl } from './utils.js';

export class ResponseParser {
	_parsePost({ data: { xdt_shortcode_media: response } }) {
		if (!response) {
			return { error: 'Post not found. Either update your cookies or try again later.' };
		}

		let { username, full_name: fullName, is_private: isPrivate, is_verified: isVerified } = response.owner;
		let {
			edge_media_preview_like: { count: likeCount },
			taken_at_timestamp: takenAt,
			edge_media_preview_comment: { count: commentCount },
			__typename: mediaType
		} = response;

		const captions = response.edge_media_to_caption?.edges?.[0]?.node?.text ?? 'No captions';
		const type = mediaType === 'XDTGraphSidecar' ? 'slide' : mediaType === 'XDTGraphVideo' ? 'video' : 'image';

		let result = { username, fullName, isPrivate, isVerified, likeCount, takenAt, commentCount, captions, post: [] };

		if (type === 'slide') {
			let { edges: posts } = response.edge_sidecar_to_children;

			for (const { node: post } of posts) {
				const isVideo = post.__typename === 'XDTGraphVideo';

				result.post.push({
					isVideo: isVideo,
					url: isVideo ? post.video_url : post.display_resources[post.display_resources.length - 1].src,
					urlPost: `https://instagram/p/${post.shortcode}`
				});
			}
		} else {
			const isVideo = type === 'video';

			result.post.push({
				isVideo: isVideo,
				...(isVideo && { duration: response.video_duration }),
				url: isVideo ? response.video_url : response.display_resources[response.display_resources.length - 1].src,
				urlPost: `https://instagram/p/${response.shortcode}`
			});
		}

		return result;
	}

	_parseProfile(response) {
		if (!response || !response.id) {
			return { error: 'Profile not found. Either update your cookies or try again later.' };
		}

		return {
			id: response.id,
			biography: response.biography,
			followers: response.edge_followed_by.count,
			following: response.edge_follow.count,
			fullName: response.full_name === '' ? 'No Fullname' : response.full_name,
			highlightCount: response.highlight_reel_count,
			isBusinessAccount: response.is_business_account,
			isRecentUser: response.is_joined_recently,
			accountCategory: response.business_category_name,
			linkedFacebookPage: response.connected_fb_page,
			isPrivate: response.is_private,
			isVerified: response.is_verified,
			profilePic: response.profile_pic_url,
			profilePicHD: response.profile_pic_url_hd,
			username: response.username,
			postsCount: response.edge_owner_to_timeline_media.count,
			posts:
				response.edge_owner_to_timeline_media.edges.map((edge) => {
					const hasCaption = edge.node.edge_media_to_caption.edges[0];

					return {
						id: edge.node.id,
						shortCode: edge.node.shortcode,
						url: `https://www.instagram.com/p/${edge.node.shortcode}/`,
						dimensions: edge.node.dimensions,
						isVideo: edge.node.is_video,
						mediaUrl: edge.node.is_video ? edge.node.video_url : edge.node.display_url,
						caption: hasCaption ? hasCaption.node.text : '',
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
									isVideo: edge.node.is_video,
									mediaUrl: edge.node.is_video ? edge.node.video_url : edge.node.display_url
								}))
							: []
					};
				}) || []
		};
	}

	_parseProfiles(response) {
		if (!response || !response.users) {
			return { error: 'Profiles not found. Either update your cookies or try again later.' };
		}

		return response.users.map((v) => ({
			id: v.pk,
			fullName: v.full_name === '' ? 'No Fullname' : v.full_name,
			username: v.username,
			isVerified: v.is_verified,
			isPrivate: v.is_private,
			profilePic: v.profile_pic_url
		}));
	}

	_parseCode(input) {
		const parse = input.match(/([-_0-9a-zA-Z]{11})/);

		return parse === null ? false : parse[0];
	}

	_parseItemMediaType(data) {
		const isVideo = data.media_type === 2 || data.is_video;

		if (isVideo) {
			const url = data.video_versions?.[0]?.url || data.video_url;

			return { isVideo: true, duration: data.video_duration, url };
		}

		const url = data.image_versions2?.candidates?.[0]?.url || data.display_url;

		return { isVideo: false, id: data.pk, url };
	}

	_parseStory({ user, data, isInputURL, STORY_ID }) {
		if (user.posts) {
			delete user.posts;
		}

		data = data.reel;
		const reelUser = data?.user || {};
		const result = {
			...user,
			username: user.username || reelUser.username,
			fullName: user.fullName || user.full_name || reelUser.full_name || '',
			isPrivate: user.isPrivate ?? user.is_private ?? reelUser.is_private ?? false,
			isVerified: user.isVerified ?? user.is_verified ?? reelUser.is_verified ?? false,
			profilePic: user.profilePic || user.profile_pic_url || reelUser.profile_pic_url || '',
			biography: user.biography || '',
			followers: user.followers || user.follower_count || 0,
			following: user.following || user.following_count || 0,
			highlightCount: user.highlightCount || 0,
			postsCount: user.postsCount || 0,
			isBusinessAccount: user.isBusinessAccount || false,
			isRecentUser: user.isRecentUser || false,
			accountCategory: user.accountCategory || null,
			linkedFacebookPage: user.linkedFacebookPage || null,
			totalStories: data.media_count,
			stories: []
		};

		if (!result.totalStories && !user.isPrivate) {
			return { error: `User ${user.username} doesn't have any stories available.` };
		}

		if (
			!result.totalStories &&
			!data.user?.friendship_status?.following &&
			!data.user?.friendship_status?.followed_by &&
			user.isPrivate
		) {
			return { error: `User ${user.username} is private. And the bot is not following the user.` };
		}

		if (isInputURL && STORY_ID) {
			const item = data.items.find((item) => item.pk === STORY_ID);

			if (!item) {
				return { error: `Story with the id [${STORY_ID}] not found from \`${user.username}\`.` };
			}

			result.stories.push(this._parseItemMediaType(item));
			return result;
		}

		for (const item of data.items) {
			result.stories.push(this._parseItemMediaType(item));
		}

		return result;
	}

	_parseHighlight(data) {
		const reelsMedia = data?.data?.reels_media?.[0] || null;
		const reels = data?.reels || null;
		const reelKey = reels ? Object.keys(reels)[0] : null;
		const reel = reelsMedia || (reelKey ? reels[reelKey] : null);

		if (!reel || !reel.items?.length) {
			return [];
		}

		return reel.items.map((edge) => {
			const isVideo = edge.is_video || edge.media_type === 2;
			const url = isVideo
				? edge.video_resources?.[0]?.src || edge.video_versions?.[0]?.url
				: edge.display_url || edge.image_versions2?.candidates?.[0]?.url;

			return {
				parentId: reel.id,
				mediaId: edge.id || edge.pk,
				mimetype: isVideo ? 'video/mp4' : 'image/jpeg',
				takenAt: edge.taken_at_timestamp || edge.taken_at,
				type: isVideo ? 'video' : 'image',
				url,
				dimensions: edge.dimensions || { width: edge.original_width, height: edge.original_height }
			};
		});
	}

	_parseHashtag(data) {
		return {
			totalPostFormatted: data.formatted_media_count,
			totalPostRaw: data.media_count,
			thumbnail: data.profile_pic_url,
			posts: data.top.sections
				.map(({ layout_content: layoutContent }) => {
					return layoutContent.medias.map(
						({
							media: {
								taken_at: published,
								code,
								comment_count: commentCount,
								like_count: likeCount,
								media_type: mediaType,
								user: { username, full_name: fullName, profile_pic_url: avatarUrl, is_private: isPrivate },
								caption: { text: caption } = { text: 'No captions' }
							},
							media: medias
						}) => {
							mediaType = mediaType === 8 ? 'slide' : mediaType === 2 ? 'video' : 'image';

							let media;

							if (mediaType === 'slide') {
								media = medias.carousel_media.map((posts) => {
									if (posts.media_type === 1) {
										return { isVideo: false, url: posts.image_versions2.candidates[0].url };
									}

									return { isVideo: true, url: posts.video_versions[0].url, duration: posts.video_duration };
								});
							} else if (mediaType === 'video') {
								media = [{ isVideo: true, url: medias.video_versions[0].url, duration: medias.video_duration }];
							} else {
								media = [{ isVideo: false, url: medias.image_versions2.candidates[0].url }];
							}

							return {
								username,
								fullName,
								avatarUrl,
								isPrivate,
								caption,
								published,
								code,
								source: `${_baseUrl}/p/${code}`,
								commentCount,
								likeCount,
								media,
								mediaType
							};
						}
					);
				})
				.flat()
		};
	}

	_isUrl(input) {
		return /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi.test(input);
	}

	_isInstagramUrl(input) {
		return /(https?:\/\/(?:www\.)?instagram\.com\/(p|reel|tv|s|stories)\/([^/?#&]+)).*/.test(input);
	}

	_appendParams(url, params) {
		const urls = new URLSearchParams(params);

		return url + urls.toString();
	}
}
