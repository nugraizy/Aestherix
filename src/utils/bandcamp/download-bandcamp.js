import { fetchTEXT } from '../modules/index.js';

/**
 * Download bandcamp tracks.
 * @param {string} url valid bandcamp url.
 * @returns {Promise<{title?: string, artist?: string, thumbnail?: string, mp3?: string, duration?: number, error?: string}>}
 */
export const downloadBandcamp = async (url) => {
	const html = await fetchTEXT(url);

	const match = html.match(/data-tralbum="({.+?})"/s) || html.match(/data-tralbum='({.+?})'/s);

	if (!match) {
		return { error: 'Could not find track data on this page.' };
	}

	const decoded = match[1]
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, '&')
		.replace(/&#(\d+);/g, (_, c) => String.fromCharCode(c));
	const tralbum = JSON.parse(decoded);
	const trackInfo = tralbum?.trackinfo?.[0];

	if (!trackInfo?.file) {
		return { error: 'No streamable audio found. Track may require purchase.' };
	}

	const fileEntries = Object.entries(trackInfo.file);
	const mp3Entry = fileEntries.find(([k]) => k.includes('mp3')) || fileEntries[0];
	const mp3Url = mp3Entry?.[1];

	if (!mp3Url) {
		return { error: 'No audio URL found.' };
	}

	const artist = tralbum?.artist || '';
	const title = trackInfo?.title || tralbum?.current?.title || '';
	const thumbnail =
		html.match(/<a class="popupImage"[^>]*href="([^"]+)"/)?.[1] ||
		html.match(/property="og:image"[^>]*content="([^"]+)"/)?.[1] ||
		null;

	return {
		title: artist ? `${artist} - ${title}` : title,
		artist,
		thumbnail,
		mp3: mp3Url.startsWith('//') ? `https:${mp3Url}` : mp3Url,
		duration: trackInfo?.duration || null
	};
};
