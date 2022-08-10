import { cheerioLOAD, fetchJSON, fetchTEXT } from "../../Helper/index.js";

export const tiktokDownloader = (url) =>
	new Promise(async (resolve) => {
		try {
			url = url.includes("vm.tiktok.com") ? url.replace("vm.tiktok.com", "vt.tiktok.com") : url;
			const data = await fetchJSON(URL_KEY_PARSER(url));
			if (data.status !== "success") resolve(data);
			const dataResult = await fetchJSON(URL_DETAIL_PARSER(data.data.key));
			if (dataResult.status !== "success") resolve(dataResult);
			resolve({
				...dataResult.data.author,
				description: dataResult.data.description,
				with_watermark: URL_BASE_DOWNLOAD(dataResult.data.video.with_watermark),
				no_watermark: URL_BASE_DOWNLOAD(dataResult.data.video.no_watermark),
				no_watermark_raw: dataResult.data.video.no_watermark_raw,
				music: URL_BASE_MUSIC(dataResult.data.music),
			});
		} catch (e) {
			resolve(e);
		}
	});

export const tiktokAPI = (url) =>
	new Promise(async (resolve) => {
		try {
			url = url.includes("vm.tiktok.com") ? url.replace("vm.tiktok.com", "vt.tiktok.com") : url;
			const res = await fetchTEXT(url, {
				headers: {
					"user-agent": UA(),
					cookie: `csrf_session_id=348df13992e0e564d8bbd93f41a1c00f; tt_csrf_token=QxO27ruj-L6HOddS82Os_poFTLnl94OdK6Fk; _tea_utm_cache_3053={%22utm_source%22:%22copy%22%2C%22utm_medium%22:%22android%22%2C%22utm_campaign%22:%22client_share%22}; _tea_utm_cache_1988={%22utm_source%22:%22copy%22%2C%22utm_medium%22:%22android%22%2C%22utm_campaign%22:%22client_share%22}; _tea_utm_cache_345918={%22utm_source%22:%22copy%22%2C%22utm_medium%22:%22android%22%2C%22utm_campaign%22:%22client_share%22}; _abck=22906F893C472C8C7A6AB32B92385C48~-1~YAAQR57YF/x4Dq6BAQAAlz0RCwitlsF21vzbZuzlKnZ0VZAX1mujuVu/MkF0AiFx8uwF35B0ni/iMON7fhMPIlMVZvx18PN45UcwZ54t9Gkm/VwOKmzL/Sg3ilSkOfWHqUOh4PAfRk4IF7WgT8Zq/7ZyQ5IaEhMc8IOk4aK/EXXPh/XC+zKujFZTB/VFOnDw0zKGZcH77Zr3TWcLwMuAR1mPR7+KIjXrArmF5bNY9t2k12xTazR3tvI949zRj+OnvREwpEKV4+Q9VUuwjVUrx8Me2emi6D1zMNCEuM59V9BOAs4+aNIg7JBlNO4v5JASC7jt39bvY7yneCnkphn+ynlN2HUukIhUXU/agV55UrI3G7MWiw0qCB88u96hXH75Jis39GoZmw==~-1~-1~-1; bm_sz=52BB5DE132A974C255392D756B74B9F4~YAAQR57YF/14Dq6BAQAAlz0RCxBPYByJBFc/d1PWoWJ/obVgH9bcyOPPer406nOaj6X1sSqtYtPxSygYRDU/1bwsB1T1o+j8obIuuVYTkmFpNi+b2h+yVJiCmNhPUHxqYWgmai5k8Qc4kLGS/yDoB3tdol78pQ/BxMLTHmGTpHi9c9u8e8HuTOExgbJS8oYxF1Ka0p8fRuHjq4QXksu233OV6dM6e3YKM0AT97meGC7s8k4KLdIicprwY+afSYZLcOpJwohIqi548lz1oUn5ZJ3vOS1fj5GRYXM8LqfnQFVNLPw=~4605505~3491384; __tea_cookie_tokens_1988=%257B%2522web_id%2522%253A%2522%2522%252C%2522timestamp%2522%253A1658043058419%257D; s_v_web_id=verify_l5p010mf_7BLO6dEl_aZGq_4y2q_9g2H_WPr6dgZkcGwX; __tea_cache_tokens_1988={%22user_unique_id%22:%227117609126503548418%22%2C%22timestamp%22:1658043058418%2C%22_type_%22:%22default%22}; ak_bmsc=DBDD5955C4149588C9CF09D3A9925E32~000000000000000000000000000000~YAAQR57YFwZ5Dq6BAQAAQYERCxC8wmv+l5gkF6FUH3/8TnxicUpUiPjoa830oYusBM7DDSKQkoh3psmYapIFcXt4oGnHGv67r+aRvOa0YrZYGQK0ggMiE8yXMVIjEr79ohKmLd6OFFFtsrZuQX2OSL5E/R/+Csvq4d7HFu0PlErFxUo/ow2KP/dMTILFca7CVD2dIz5MXJXxptkKyzZTUCYKwUvD+bJHzH2PGB9+Ya8WugederMbj3R5Wi0WA2y5ilTbc1L+asZVU7CQPgChqE2/8WoNPsmvbx9wnLQSKkXl/BQfcxx12zoIlsjXvLEOfe1kOAf+1ifrI9UsdQxyvzeFNSfGDhYjmw4B0Tt2jI5rsAy286LqgXqHG+fXTcDiQdbzr1CDuQAlCA==; bm_sv=0349A0CDED4628960B1EF72875EC23FB~YAAQN57YF0IFpseBAQAAMhozCxDRq5Biev+GbDv9kjdUIiWQvTQxJVRgfwSTY1mHbID1OOQwsPZWNs2hWt2RLM73+SV6FMVmQlV47baJPCvsBcC2h4z5K/TM0GvYWUHepSVziewXO/2P4pKJnpUSlG5sY4AdeUU4uo4hdKrI4/2EgI9RSIuvobLqFBpNDSVHV4lMqnRUFqbS5BzIcD3xojAVXsnhWGAdyiWI2rDhglYjizdI0giOc9IHOIpiYT8y~1; ttwid=1%7CtoWpGkXAE-a4TNVXBvhd06MBdJKeCMZEaW4A_pfgq-c%7C1658045308%7Cb4b636f39a8180d477a1bb8eebd614d8fc95789def4d34de61639b99a478a19e; msToken=wfsgfY1caoL6YuN9B8GmZOgv2yX5VtsyKvICoA4D4dAoKLY11EF7HVwrjsrAFsRjIOOmvCiBunGK5pntDyOfqa4RUXrSIUqk1tvPxasFtwBYczJ6HmpHkloa62Y75AfYOBylMriK2QoUbAo=; msToken=cm6If5LKeROB11ipS4Xjdz9ZFe5ZtqlbfnhTwnCExT2N911M1hQ8STLFoXTv0bRAwSkFKg78BCFGXNcYXqm2CZzR7tRDElsWzs_wocM-P76P0y6tojtiy8CAjfZneQUZmvyZ4XhMJwvNYu4=`,
				},
			});
			const $ = cheerioLOAD(res);
			const parsed = await parseData(JSON.parse($("#SIGI_STATE").html()));
			if (parsed.type == "images") {
				resolve(parsed);
			}
			const with_no_watermark = (await fetchJSON(URL_API(parsed.keyword))).aweme_detail.video.play_addr.url_list[Math.floor(Math.random() * 3)];
			parsed.published = Number(parsed.published);
			parsed.url = {
				...parsed.url,
				with_no_watermark,
			};
			resolve(parsed);
		} catch (err) {
			log(err);
			resolve({ error: err.message });
		}
	});

const parseData = async (arr) => {
	const {
		ItemList: {
			video: { keyword },
		},
	} = arr;
	if (arr.ItemModule[keyword] == undefined) {
		const data = await fetchJSON(URL_API(keyword));
		const {
			nickname,
			unique_id: author,
			signature: biograph,
			avatar_larger: { url_list: profilePicture },
		} = data.aweme_detail.author;
		const { digg_count: liked, share_count: shared, comment_count: comment, play_count: view } = data.aweme_detail.statistics;
		const {
			desc: videoDescription,
			image_post_info: { images },
		} = data.aweme_detail;
		const music = data.aweme_detail?.music?.play_url?.uri ?? "N/A";
		const musicDuration = data.aweme_detail?.music?.duration ?? "N/A";
		const authorMusic = data.aweme_detail?.music?.matched_song?.author ?? "N/A";
		const musicTitle = data.aweme_detail?.music?.matched_song?.title ?? "N/A";
		data.aweme_detail?.music;
		return {
			keyword,
			nickname,
			type: "images",
			author,
			liked,
			shared,
			comment,
			view,
			biograph,
			videoDescription,
			music: {
				authorMusic,
				musicTitle,
				musicDuration,
				music,
			},
			profilePicture: profilePicture[0],
			images: images.map((v, i) => {
				return {
					url: v.display_image.url_list[1],
					index: i + 1,
				};
			}),
		};
	}
	const {
		desc: videoDescription,
		createTime: published,
		author,
		stats: { diggCount: liked, shareCount: shared, commentCount: comment, playCount: view },
		authorStats: { followerCount: followers, followingCount: following, heart, videoCount: totalVideo },
		locationCreated,
		nickname,
		avatarThumb: profilePicture,
		video: { downloadAddr: with_watermark, duration: videoDuration, ratio, cover: videoThumbnail },
		music: { title: musicTitle, authorName: authorMusic, playUrl: music, duration: musicDuration },
	} = arr?.ItemModule?.[keyword];
	const { signature: biograph, verified } = arr?.UserModule?.users?.[author];
	return {
		keyword,
		author,
		nickname,
		biograph,
		verified,
		liked,
		shared,
		comment,
		view,
		videoDescription,
		published,
		followers,
		following,
		heart,
		totalVideo,
		locationCreated,
		musicTitle,
		authorMusic,
		videoDuration,
		musicDuration,
		ratio,
		url: {
			profilePicture,
			videoThumbnail,
			music,
			with_watermark,
		},
	};
};

const URL_KEY_PARSER = (input) => `https://api.ngutek.com/video-key?video_url=${input}`;
const URL_DETAIL_PARSER = (input) => `https://api.ngutek.com/video-details-by-key?key=${input}`;
const URL_BASE_DOWNLOAD = (input) => `https://api.ngutek.com/download?key=${input}&type=video`;
const URL_BASE_MUSIC = (input) => `https://api.ngutek.com/download?key=${input}&type=music`;
const URL_API = (input) => `https://api2.musical.ly/aweme/v1/aweme/detail/?aweme_id=${input}`;
const UA = () => "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36";
