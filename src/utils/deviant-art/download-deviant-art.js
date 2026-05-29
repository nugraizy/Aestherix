import { cheerioLOAD, color, fetchTEXT, loggers } from '../modules/index.js';
import { parse } from './utils.js';

const COOKIE = process.env.DEVIANTART_COOKIE || '';

const check = (i) => (i === -1 ? undefined : i);

export const downloadDeviantArt = (input) =>
	new Promise(async (resolve, reject) => {
		try {
			const { pathname } = new URL(input);
			const lastSegment = pathname.split('/').filter(Boolean).pop() || '';
			const deviantid = lastSegment.split('-').pop() || lastSegment;

			const headers = {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
			};

			let data;
			let downloadLink = null;

			if (COOKIE) {
				try {
					const authData = await fetchTEXT(input, { headers: { ...headers, Cookie: COOKIE } });
					const $auth = cheerioLOAD(authData);

					downloadLink = $auth('a[download][href*="/download/"]').attr('href') || null;

					if (downloadLink || $auth('body > script').get(0)?.firstChild?.data) {
						data = authData;
					}
				} catch {
					// Cookie failed, fall through
				}
			}

			if (!data) {
				data = await fetchTEXT(input, { headers });
			}

			const $ = cheerioLOAD(data);

			if (!downloadLink) {
				downloadLink = $('a[download][href*="/download/"]').attr('href') || null;
			}

			let json = null;
			const scripts = $('script').toArray();

			for (const script of scripts) {
				const text = $(script).html() || '';

				if (text.includes('window.__INITIAL_STATE__')) {
					json = text;
					break;
				}
			}

			let title = '';
			let author = '';
			let image = null;

			if (json) {
				json = parse(json);
				const deviation = json['@@entities']?.deviation?.[deviantid];

				if (deviation) {
					title = deviation.title || '';
					author = deviation.author?.username || '';

					const mediaTypes = deviation.media?.types || [];
					const fullviewIdx =
						check(mediaTypes.findIndex((w) => w.t === 'fullview' && w.c != undefined)) ??
						mediaTypes.findIndex((w) => w.t === 'social_preview');

					if (fullviewIdx >= 0 && deviation.media?.baseUri) {
						image = `${deviation.media.baseUri}${mediaTypes[fullviewIdx].c?.replace('<prettyName>', deviation.media.prettyName)}${
							deviation.media.token?.[0] ? `?token=${deviation.media.token[0]}` : ''
						}`;
					}
				}
			}

			if (!title) {
				title = $('meta[property="og:title"]').attr('content') || 'DeviantArt';
			}

			if (!image) {
				image = $('meta[property="og:image"]').attr('content') || null;
			}

			resolve({
				id: deviantid,
				title,
				author,
				source: input,
				image: downloadLink || image,
				downloadLink: downloadLink || null,
				preview: image
			});
		} catch (err) {
			loggers.error(color('DeviantArt download failed:', 'red'), err);
			reject(err);
		}
	});
