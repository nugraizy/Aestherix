export const extractInfoFromUrl = (url) => {
	const reg = /https:\/\/bsky\.app\/profile\/(.*)\/post\/(.*)/g;

	const info = reg.exec(url);

	if (!info) {
		return null;
	}

	return {
		user: info[1],
		id: info[2]
	};
};
