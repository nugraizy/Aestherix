import { getUser } from "./index.js";

const UA_IP = "Instagram 123.0.0.21.114 (iPhone; CPU iPhone OS 11_4 like Mac OS X; en_US; en-US; scale=2.00; 750x1334) AppleWebKit/605.1.15";
const sessionId = process.env.INSTAGRAM_SESI;

export const getHighlights2 = (username) =>
	new Promise(async (resolve, reject) => {
		try {
			const items = await fetchId(username);
			const Container = await Promise.all(items.map((v) => fetchHighlights(v.highlight_id)));
			resolve(Container.map((v, i) => ({ title: items[i].title, thumbnail: items[i].cover, totalHighlight: Container[i].length, dataHighlight: Container[i] })));
		} catch (err) {
			reject({ error: err });
		}
	});

const appendParams = (url, params) => {
	const urls = new URL(url);
	Object.keys(params).forEach((key) => urls.searchParams.append(key, params[key]));
	return urls;
};

const fetchId = async (usernames) => {
	const { id } = await getUser(usernames);
	const data = await fetchJSON(
		appendParams("https://www.instagram.com/graphql/query/", {
			query_hash: "c9100bf9110dd6361671f113dd02e7d6",
			variables: JSON.stringify({ user_id: id, include_chaining: false, include_reel: true, include_suggested_users: false, include_logged_out_extras: false, include_highlight_reels: true, include_live_status: false }),
		}),
		{
			method: "GET",
			headers: { "user-agent": UA_IP, cookie: `sessionid=${sessionId};` },
		},
	);
	return data.data.user.edge_highlight_reels.edges.map((edge) => ({ highlight_id: edge.node.id, cover: edge.node.cover_media.thumbnail_src, title: edge.node.title }));
};

const fetchHighlights = async (id) => {
	const data = await fetchJSON(
		appendParams("https://www.instagram.com/graphql/query/", {
			query_hash: "0a85e6ea60a4c99edc58ab2f3d17cfdf",
			variables: JSON.stringify({ reel_ids: [], tag_names: [], location_ids: [], highlight_reel_ids: [id], precomposed_overlay: false, show_story_viewer_list: true, story_viewer_fetch_count: 50, story_viewer_cursor: "", stories_video_dash_manifest: false }),
		}),
		{
			method: "GET",
			headers: { "user-agent": UA_IP, cookie: `sessionid=${sessionId};` },
		},
	);
	return data.data.reels_media[0].items.map((edge) => ({
		media_id: edge.id,
		mimetype: edge.is_video ? "video/mp4" || "video/gif" : "image/jpeg",
		taken_at: edge.taken_at_timestamp,
		type: edge.is_video ? "video" : "image",
		url: edge.is_video ? edge.video_resources[0].src : edge.display_url,
		dimensions: edge.dimensions,
	}));
};
