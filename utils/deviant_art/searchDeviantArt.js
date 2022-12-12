/* global log */
import axios from 'axios';

import { parse } from './utils.js';

const check = (i) => (i == -1 ? undefined : i);
const _api = (input) => `https://www.deviantart.com/search?q=${input}`;

export const searchDeviantArt = (keyword) =>
	new Promise(async (resolve, reject) => {
		try {
			const { data } = await axios.get(_api(keyword), {
				headers: {
					cookie:
						'userinfo=__441a65b263bee37be067%3B%7B%22username%22%3A%22itztobz%22%2C%22uniqueid%22%3A%221e7d06bc72e9950e224355da022fa703%22%2C%22dvs9-1%22%3A1%2C%22ab%22%3A%22tao-acs-1-b-4%7Ctao-sdd-1-b-2%7Ctao-fh9-1-b-2%22%7D; vd=__c6e0c3a3a35e3c88f4b7%3B%22BjgJ%2Bs%2CBjg34s%2CA%2CV%2CA%2C%2CB%2CA%2CB%2CBjg34s%2CBjg39E%2CA%2CA%2CA%2CA%2C13%2CA%2CB%2CA%2CA%2CA%2CA%2CB%2CA%2CA%2C%22; _pbjs_userid_consent_data=3524755945110770; na-unifiedid=%7B%22TDID%22%3A%22ac965f3b-3ecb-47a8-aa72-379a6b30404b%22%2C%22TDID_LOOKUP%22%3A%22FALSE%22%2C%22TDID_CREATED_AT%22%3A%222022-11-25T13%3A16%3A12%22%7D; cto_bundle=X1Fmu19TaG9NY0FiSFpkOEJpRWgwUnd2YWdLOUE4a0NSWUZHdmVHaHFsMFJTRno3UUdoU01tUVBLTlBLJTJCWjV5ZkpoQmRJN3pubVJGdSUyRkY1dWMyemhHTVF3UXpoYUdkZiUyRkhCQklyWlVCJTJGRGR3RXNvQUpkeERXSTM3JTJCSnQzVHlaTlFnRlRxV1olMkJPR2FUaWVQTjU1OTA0WHQlMkZSdyUzRCUzRA; td=7:944%3B12:985x655%3B20:880; auth=__c5acaafdc2314556e691%3B%22790911085c5de67813aedc75cc5364d1%22; auth_secure=__bc3d420e95461761868a%3B%22391dfc9fd15d84c61ba7b56cc280db43%22',
					'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36',
					'upgrade-insecure-requests': 1,
				},
				validateStatus: () => true,
			});

			const json = parse(data);

			resolve(
				Object.entries(json['@@entities'].deviation)
					.map((v) => v[1])
					.map((v) => {
						const image = `${v.media.baseUri}${v.media.types[
							check(v.media.types.findIndex((w) => w.t == 'fullview' && w.c != undefined)) ?? v.media.types.findIndex((w) => w.t == 'social_preview')
						].c?.replace('<prettyName>', v.media.prettyName)}${v.media.token?.[0] ? `?token=${v.media.token[0]}` : ''}`;

						const { pathname } = new URL(v.url);

						const username = pathname.split('/')[1];

						return {
							id: v.deviationId,
							title: v.title,
							author: username,
							authorId: v.author,
							favourites: v.stats.favourites,
							views: v.stats.views,
							source: v.url,
							image,
						};
					}),
			);
		} catch (err) {
			log(err);
			reject(err);
		}
	});
