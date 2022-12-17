/* global log */
import { cheerioLOAD, fetchJSON, fetchTEXT } from '../../helper/index.js';

const _api = (input) => `https://www.instagram.com/${input}/?__a=1&__d=dis`;
const userAgent =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36';
const sessionId =
	process.env.INSTAGRAM_SESI ||
	(await (await import('./insta-cookie.js')).getCookie(process.env.INSTAGRAM_USERNAME, process.env.INSTAGRAM_PASSWORD));

// Scrape by Alphanum404.
export const getProfile = (username) =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await fetchTEXT(`https://www.picuki.com/profile/${username}`);
			const $ = cheerioLOAD(data);
			const media = [];

			$('.photo')
				.find('a > img')
				.each((_, elem) => media.push({ url: $(elem).attr('src') }));
			$('.photo-info')
				.find('.photo-description')
				.each((i, elem) => (media[i].caption = $(elem).text().trim()));
			$('.post-footer')
				.find('.likes_photo')
				.each((i, elem) => (media[i].likes = $(elem).text().trim()));
			$('.post-footer')
				.find('.comments_photo')
				.each((i, elem) => (media[i].comments = $(elem).text().trim()))
				.text();

			if ($('.profile-name-top').text().trim() == '' && $('.follows').text().trim() == '') {
				return resolve({ error: 'User not found.' });
			}

			resolve({
				fullName: $('.profile-name-bottom').text().trim() !== '' ? $('.profile-name-bottom').text().trim() : 'Not Available.',
				userName: $('.profile-name-top').text().trim(),
				following: $('.follows').text().trim(),
				followers: $('.followed_by').text().trim(),
				bio: $('.profile-description').text().trim() !== '' ? $('.profile-description').text().trim() : 'Not Available.',
				post: $('.total_posts').text().trim(),
				thumb: $('.profile-hd-link.launchLightbox').attr('data-video-poster'),
				latestPost: media,
			});
		} catch (e) {
			reject(e);
		}
	});

export const getUser = (username) =>
	new Promise(async (resolve, reject) => {
		try {
			if (username.startsWith('@')) {
				username = username.replace('@', '');
			}

			const { graphql } = await fetchJSON(_api(username), {
				headers: {
					'user-agent': userAgent,
					cookie: sessionId,
				},
			});

			if (!graphql) {
				return resolve({ error: `User ${username} not found.` });
			}

			const { user } = graphql;

			resolve({
				id: user.id,
				biography: user.biography,
				followers: user.edge_followed_by.count,
				following: user.edge_follow.count,
				fullName: user.full_name == '' ? 'No Fullname' : user.full_name,
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
										imageUrl: edge.node.display_url,
										isVideo: edge.node.is_video,
								  })) /* eslint-disable-line */
								: [],
						};
					}) || [],
			});
		} catch (e) {
			log(e);
			reject(e);
		}
	});
