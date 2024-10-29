import { Innertube } from 'youtubei.js';

export const youtubeLiveComments = async (query) =>
	new Promise(async (resolve) => {
		try {
			const youtube = await Innertube.create();
			const info = await youtube.getInfo(query);

			if (!info.basic_info.is_live) {
				resolve({ error: 'not a live video' });
			}

			resolve(info.getLiveChat());
		} catch {
			resolve({
				error: 'video not found'
			});
		}
	});
