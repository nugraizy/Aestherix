import Axios from "axios";
const sessionId = process.env.INSTAGRAM_SESI;

export const getPost = (code) =>
	new Promise(function (resolve, reject) {
		if (!code) return reject(new Error('Argument "code" must be specified'));
		try {
			Axios.get(`https://www.instagram.com/p/${code}/?__a=1`, {
				headers: {
					Cookie: `sessionid=${sessionId}`,
				},
			})
				.then(({ data }) => {
					let { username, full_name, is_private, is_verified } = data.items[0].user;
					let { like_count, carousel_media_count, taken_at, comment_count, media_type } = data.items[0];
					const captions = data.items[0].caption?.text ?? "No captions";
					const type = media_type == 8 ? "slide" : media_type == 2 ? "video" : "image";
					carousel_media_count = carousel_media_count ?? 1;
					let result = { username, full_name, is_private, is_verified, like_count, carousel_media_count, taken_at, comment_count, captions, post: [] };
					if (type == "slide") {
						let { carousel_media: posts } = data.items[0];
						for (let i = 0; i < posts.length; i++) {
							if (posts[i].media_type == 1) {
								result.post.push({ isVideo: false, url: posts[i].image_versions2.candidates[0].url });
							} else if (posts[i].media_type == 2) {
								result.post.push({ isVideo: true, url: posts[i].video_versions[0].url, duration: posts[i].video_duration });
							}
						}
					} else if (type == "image") {
						result.post.push({
							isVideo: false,
							url: data.items[0].image_versions2.candidates[0].url,
						});
					} else if (type == "video") {
						result = {
							...result,
							play_count: data.items[0].play_count,
						};
						result.post.push({ isVideo: true, url: data.items[0].video_versions[0].url });
					}
					resolve(result);
				})
				.catch(reject);
		} catch (e) {
			console.log(e);
		}
	});
