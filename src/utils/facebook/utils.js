export const parse = (data) => {
	const { links, title, thumbnail } = data;

	const urls = links.video.map((v) => ({
		url: v.url,
		type: v.q_text.includes('Audio') ? 'audio' : 'video',
		resolution: /\[(.*?)\]/g.exec(v.q_text)?.[1] ?? 'unknown'
	}));

	return {
		title,
		thumbnail,
		url: urls
	};
};
