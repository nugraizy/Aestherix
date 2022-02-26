import fetch from "node-fetch";
const sessionId = process.env.INSTAGRAM_SESI;

export const getPost = (code) =>
	new Promise(async (resolve, reject) => {
		if (!code) return reject(new Error('Argument "code" must be specified'));
		try {
			const data = await (await fetch(`https://www.instagram.com/p/${code}/?__a=1`, { headers: { Cookie: `sessionid=${sessionId}` } })).json();
			let { username, full_name, is_private, is_verified } = data.items[0].user;
			let { like_count, carousel_media_count, taken_at, comment_count, media_type } = data.items[0];
			const captions = data.items[0].caption?.text ?? "No captions";
			const type = media_type == 8 ? "slide" : media_type == 2 ? "video" : "image";
			carousel_media_count = carousel_media_count ?? 1;
			let result = { username, full_name, is_private, is_verified, like_count, carousel_media_count, taken_at, comment_count, captions, post: [] };
			if (type == "slide") {
				let { carousel_media: posts } = data.items[0];
				for (const post of posts)
					if (post.media_type == 1) result.post.push({ isVideo: false, url: post.image_versions2.candidates[0].url });
					else if (post.media_type == 2) result.post.push({ isVideo: true, url: post.video_versions[0].url, duration: post.video_duration });
			} else if (type == "image") result.post.push({ isVideo: false, url: data.items[0].image_versions2.candidates[0].url });
			else if (type == "video") {
				result = { ...result, play_count: data.items[0].play_count };
				result.post.push({ isVideo: true, url: data.items[0].video_versions[0].url });
			}
			resolve(result);
		} catch (e) {
			console.log(e);
		}
	});
