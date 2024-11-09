import { isURL } from '../modules/index.js';

export const _api = 'https://api.tiktokv.com/';
const _apiBase = (input) => `https://www.tiktok.com/${input}`;
export const _apiBaseVideo = (...input) => _apiBase(`@${input[0]}/video/${input[1]}`); // eslint-disable-line
export const iids = ['7379691220551141126', '7318518857994389254'];
export const deviceIds = ['7379690547022071302', '7318517321748022790'];
export const appVersion = ['35.1.3'];
export const random = (arr) => arr[~~(Math.random() * arr.length)];
export const lastInstall = () => {
	const currentTimeSeconds = Math.floor(Date.now() / 1000);
	const randomSeconds = Math.floor(Math.random() * (1123200 - 86400 + 1)) + 86400;
	const result = currentTimeSeconds - randomSeconds;

	return result;
};
const regex = (input) => /(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok.com\/([^\s&]+)/gi.test(input);

export const checkValid = (url) => {
	if (!isURL(url)) {
		return { error: true, message: 'Please specify a valid url' };
	} else if (!regex(url)) {
		return { error: true, message: 'Please specify a valid TikTok url' };
	}

	return { error: false, message: '' };
};
