import { fetch } from 'undici';
import crypto from 'crypto';
import asyncRetry from 'async-retry';

import { cheerioLOAD } from '../modules/index.js';

const messageId = crypto.randomUUID();
const host = 'https://www.bing.com';
const finalApi = (id, query) => `https://www.bing.com/images/create/async/results/${id}?q=${query.replace(/\s/g, '+')}`;

const headers = {
	Accept:
		'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
	'Accept-Language': 'en-US,en;q=0.9',
	'Cache-Control': 'no-cache',
	'Sec-Ch-Ua': '"Microsoft Edge";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
	'Sec-Ch-Ua-Arch': '"x86"',
	'Sec-Ch-Ua-Bitness': '"64"',
	'Sec-Ch-Ua-Full-Version': '"113.0.1774.35"',
	'Sec-Ch-Ua-Full-Version-List':
		'"Microsoft Edge";v="113.0.1774.35", "Chromium";v="113.0.5672.63", "Not-A.Brand";v="24.0.0.0"',
	'Sec-Ch-Ua-Mobile': '?0',
	'Sec-Ch-Ua-Model': '""',
	'Sec-Ch-Ua-Platform': '"Windows"',
	'Sec-Ch-Ua-Platform-version': '"11.0.0"',
	'Sec-Fetch-Dest': 'iframe',
	'Sec-Fetch-Mode': 'navigate',
	'Sec-Fetch-Site': 'same-origin',
	Pragma: 'no-cache',
	Referer: 'https://www.bing.com/search?q=Bing+AI&showconv=1&FORM=hpcodx',
	'Referrer-Policy': 'origin-when-cross-origin',
	'Upgrade-Insecure-Requests': '1',
	'X-Edge-Shopping-Flag': '1',
	'User-Agent':
		'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 YaBrowser/23.1.5.750 (beta) Yowser/2.5 Safari/537.36',
	Cookie: process.env.BING_COOKIE
};

export const createImageBing = (prompt) =>
	new Promise(async (resolve, reject) => {
		try {
			const path = `/images/create?partner=sydney&re=1&showselective=1&sude=1&q=${prompt.replace(
				/\s/g,
				'+'
			)}&iframeid=${messageId}`;

			const body = await fetch(host + path, {
				headers
			});

			const imgSrc = await body.text();

			const $1 = cheerioLOAD(imgSrc);

			const imgCheck = host + $1('div#gir').attr('data-mc');

			const id = new URL(imgCheck).searchParams.get('requestId');

			const data = await asyncRetry(
				async () => {
					const imgBody = await fetch(finalApi(id, prompt), {
						headers
					});

					if (imgBody.headers.get('content-length') <= 1) {
						throw new Error('content-length is 0');
					}

					const html = await imgBody.text();
					const $2 = cheerioLOAD(html);

					const imgSrc = $2('.dgControl.dtl')
						.find('a.iusc')
						.get()
						.map((e) => {
							const { CustomData } = JSON.parse($2(e).attr('m'));

							return JSON.parse(CustomData).MediaUrl;
						});

					return imgSrc;
				},
				{
					forever: true,
					minTimeout: 0,
					maxTimeout: 1000
				}
			);

			resolve(data);
		} catch (error) {
			reject(error);
		}
	});
