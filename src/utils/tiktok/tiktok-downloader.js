import fetch from 'node-fetch';
import { load } from 'cheerio';
import { buildHead, parseData } from './util.js';

import { fetchJSON, fetchTEXT } from '../modules/index.js';

const _api = 'https://api16-va.tiktokv.com/aweme/v1/feed/?';
const _websiteProfile = 'https://www.tiktok.com/@';

/**
 * @typedef {{author: string, uniqueId: string, nickname: string, liked: number, shared: number, comment: number, view: number, videoDescription: string, biograph: string}} ParsedContainer
 * @typedef {{music?: {authorMusic: string, musicTitle: string, musicDuration: number, music: string}}} MusicContainer
 * @typedef {{url?: {profilePicture: string, videoThumbnail: string, music: string, withNoWatermark?: string, withWatermark?: string, images?: string[]}, verified?: boolean, heart?: number, totalVideo?: number, locationCreated?: string, musicTitle?: string, authorMusic?: string, videoDuration?: number, musicDuration?: number, ratio?:string}} VideosContainer
 * @typedef {{type?: 'images', images?: {url: string, index: number}[]} & MusicContainer} ImagesContainer
 */
/**
 * Download TikTok using Official API.
 * @param {string} url
 * @returns {Promise<ParsedContainer & ImagesContainer & VideosContainer>}
 * @throws {Error}
 */
export const tiktokAPI = (url) =>
	new Promise(async (resolve, reject) => {
		try {
			url = url.includes('vm.tiktok.com') ? url.replace('vm.tiktok.com', 'vt.tiktok.com') : url;
			let keyword;

			if (/((vt|vm|vk)\.tiktok\.com)/g.test(url) || !url.includes('video')) {
				const req = (await fetch(url, { method: 'HEAD' }))?.url;

				if (!req) {
					resolve({ error: 'download failed. either the access is denied, or other error.' });
					return;
				}

				const { origin, pathname } = new URL(req);

				keyword = pathname.split('/').slice(-1)[0];

				url = origin + pathname;
			} else {
				const { pathname } = new URL(url);

				keyword = pathname.split('/').slice(-1)[0];
			}

			let json = await fetchJSON(
				`${_api}${new URLSearchParams(
					buildHead({
						aweme_id: keyword // eslint-disable-line
					}).params
				).toString()}`
			);

			json = json.aweme_list.find((v) => v.aweme_id === keyword);

			json = await parseData(json, json.image_post_info && json.image_post_info?.images.length > 0 ? 'images' : undefined);

			const userRaw = await fetchTEXT(`${_websiteProfile}${json.author}`, {
				headers: buildHead().headers
			});

			const $ = load(userRaw);
			const userDetails = JSON.parse($('script[id=SIGI_STATE]').html());
			const tempJson = { ...json };

			delete tempJson.urls;

			Object.assign(tempJson, {
				following: userDetails.UserModule.stats[json.author].followingCount,
				followers: userDetails.UserModule.stats[json.author].followerCount,
				heart: userDetails.UserModule.stats[json.author].heart,
				totalVideo: userDetails.UserModule.stats[json.author].videoCount,
				urls: json.urls
			});
			resolve(tempJson);
		} catch (err) {
			reject(err);
		}
	});
