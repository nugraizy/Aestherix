export const bilibiliParseMetadataTv = ({ title, aid, cover, author, duration, view }) => ({
	title,
	aid,
	cover,
	source: `https://www.bilibili.tv/en/video/${aid}`,
	author: author?.nickname || author,
	views: view,
	duration
});
