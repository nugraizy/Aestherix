const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36";
const sessionId = process.env.INSTAGRAM_SESI || (await (await import("./instaCookie.js")).getCookie(process.env.INSTAGRAM_USERNAME, process.env.INSTAGRAM_PASSWORD));
const BASE_URL = (code) => `https://www.instagram.com/p/${code}`;

export const searchHashtag = (query) =>
	new Promise(async (resolve, reject) => {
		try {
			if (query.includes("#")) query = query.replace("#", "");
			const { data } = await fetchJSON(`https://www.instagram.com/explore/tags/${keyword}/?__a=1&__d=dis`, {
				headers: {
					"user-agent": UA,
					cookie: sessionId,
				},
			});
			resolve(parse(data));
		} catch (e) {
			if (Object.keys(e?.response?.data)?.length == 0) return resolve({ error: "Hashtag not found" });
			reject(e);
		}
	});

const parse = (arr) => {
	return {
		totalPostFormatted: arr.formatted_media_count,
		totalPostRaw: arr.media_count,
		thumbnail: arr.profile_pic_url,
		posts: arr.top.sections
			.map(({ layout_content }) => {
				return layout_content.medias.map(
					({
						media: {
							taken_at: published,
							code,
							comment_count: commentCount,
							like_count: likeCount,
							media_type,
							carousel_media_count,
							user: { username, full_name: fullName, profile_pic_url: avatarUrl, is_private: isPrivate },
							caption: { text: caption },
						},
						media: medias,
					}) => {
						const mediaType = media_type == 8 ? "slide" : media_type == 2 ? "video" : "image";
						carousel_media_count = carousel_media_count ?? 1;
						let media;
						if (mediaType == "slide") {
							media = medias.carousel_media.map((posts) => {
								if (posts.media_type == 1) return { isVideo: false, url: posts.image_versions2.candidates[0].url };
								return { isVideo: true, url: posts.video_versions[0].url, duration: posts.video_duration };
							});
						} else if (mediaType == "video") {
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
							source: BASE_URL(code),
							commentCount,
							likeCount,
							media,
						};
					},
				);
			})
			.flat(),
	};
};
