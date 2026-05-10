import getVideoId from 'get-video-id';

export const extractVideoId = (url) => {
	const { id } = getVideoId(url);

	return id;
};
