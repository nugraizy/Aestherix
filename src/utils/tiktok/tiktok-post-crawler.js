import axios from 'axios';
import { load } from 'cheerio';

import { buildHead, parseCrawlerResponse } from './util.js';

const _api = 'https://api-h2.tiktokv.com/aweme/v1/aweme/post/?';

export const tiktokPostCrawler = (username) =>
	new Promise(async (resolve, reject) => {
		try {
			if (!username.startsWith('@')) {
				username = `@${username.replace(/[^a-zA-Z0-9_.]/gi, '')}`;
			}

			const { data: userRaw } = await axios.get(`https://tiktok.com/${username}`, {
				headers: buildHead().headers
			});
			const $ = load(userRaw);
			const userDetails = JSON.parse($('script[id=SIGI_STATE]').html());

			const url = new URLSearchParams(
				'version_name=26.1.3&version_code=2613&build_number=26.1.3&manifest_version_code=2613&update_version_code=2613&device_brand=Google&device_type=Pixel%204&device_platform=android&resolution=1080*1920&dpi=420&os_version=10&os_api=29&carrier_region=US&sys_region=US%C2%AEion=US&app_name=trill&app_language=en&language=en&timezone_name=America/New_York&timezone_offset=-14400&channel=googleplay&ac=wifi&mcc_mnc=310260&is_my_cn=0&aid=1180&ssmix=a&as=a1qwert123&cp=cbfhckdckkde1'
			);

			url.append('user_id', userDetails.UserModule.users[username.replace('@', '')].id);
			url.append('max_cursor', 0);
			url.append('count', 100);

			const { data } = await axios.get(`${_api}${url.toString()}`);

			if ('status_msg' in data) {
				resolve({
					error: 'User does not have any post'
				});

				return;
			}

			resolve(parseCrawlerResponse(data, userDetails));
		} catch (error) {
			reject(error);
		}
	});
