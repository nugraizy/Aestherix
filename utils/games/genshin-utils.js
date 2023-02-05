import axios from 'axios';
import Crypto from 'crypto';
import url from 'url';

const COOKIE =
	'mi18nLang=en-us; _MHYUUID=9b8993e8-8afc-4340-83e5-58a67f379167; DEVICEFP_SEED_ID=c0c69b9c0491032a; DEVICEFP_SEED_TIME=1658504834716; DEVICEFP=38d7ea548a4bb; G_ENABLED_IDPS=google; G_AUTHUSER_H=0; ltoken=DMy1Ln7GfGQvNlUHRpZamegbdNbT0Q5t47NNpcCx; ltuid=72233891; cookie_token=g5DdIgepWOOaC5Co4Uji8D3racVwDHVDzAHmISl8; account_id=72233891';
const STRINGS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const API_URL = {
	os: 'https://bbs-api-os.mihoyo.com/game_record/genshin/api/',
	cn: 'https://api-takumi-record.mihoyo.com/game_record/app/genshin/api/',
};
const SALT = {
	os: '6s25p5ox5y14umn1p61aqyyvbvvl3lrt',
	cn: 'xV8v4Qu54lUKrEYFZkJhB8cuOh9Asafs',
};
const HOYOLAB_VERSION = {
	os: '1.5.0',
	cn: '2.11.1',
};

const API_ENDPOINT = (server) => {
	return API_URL[server];
};
const getHoyolabV = (server) => HOYOLAB_VERSION[server];

export const getServer = (uid) => {
	const server = {
		completeServer: '',
		simplifiedServer: '',
	};
	const firstIndex = uid[0];

	if (firstIndex === '1' || firstIndex === '2') {
		server.completeServer = 'cn_gf01';
		server.simplifiedServer = 'cn';
	} else if (firstIndex === '5') {
		server.completeServer = 'cn_qd01';
		server.simplifiedServer = 'cn';
	} else if (firstIndex === '6') {
		server.completeServer = 'os_usa';
		server.simplifiedServer = 'os';
	} else if (firstIndex === '7') {
		server.completeServer = 'os_euro';
		server.simplifiedServer = 'os';
	} else if (firstIndex === '8') {
		server.completeServer = 'os_asia';
		server.simplifiedServer = 'os';
	} else if (firstIndex === '9') {
		server.completeServer = 'os_cht';
		server.simplifiedServer = 'os';
	} else {
		throw { code: -1, message: 'Invalid uid' };
	}

	return server;
};

const randomString = (num) => {
	const strings = STRINGS;
	const res = [];

	for (let i = 0; i < num; ++i) {
		res.push(strings[Math.floor(Math.random() * strings.length)]);
	}

	return res.join('');
};

const sortKeys = (obj) => {
	const copy = {};
	const allKeys = Object.keys(obj).sort();

	allKeys.forEach((key) => {
		copy[key] = obj[key];
	});
	return copy;
};

const getOSDSKey = () => {
	const time = Math.floor(Date.now() / 1000);
	const random = randomString(6);

	return `${time},${random},${Crypto.createHash('md5').update(`salt=${SALT['os']}&t=${time}&r=${random}`).digest('hex')}`;
};

const getCNDSKey = ({ query, body }) => {
	const time = Math.floor(Date.now() / 1000);
	const random = Math.floor(Math.random() * (200_000 - 100_000 + 1)) + 100_000;

	return `${time},${random},${Crypto.createHash('md5')
		.update(
			`salt=${SALT['cn']}&t=${time}&r=${random}&b=${body ? JSON.stringify(sortKeys(body)) : ''}&q=${
				query ? new url.URLSearchParams(sortKeys(query)) : ''
			}`,
		)
		.digest('hex')}`;
};

const getDS = (server, { query, body }) => {
	return server === 'os' ? getOSDSKey() : getCNDSKey({ query, body });
};

const requestHeaders = (server, { query, body }) => {
	return server === 'os'
		? {
				DS: getDS(server, { query, body }),
				Origin: 'https://webstatic-sea.hoyolab.com',
				Referer: 'https://webstatic-sea.hoyolab.com/',
				Accept: 'application/json, text/plain, */*',
				'Accept-Encoding': 'gzip, deflate',
				'Accept-Language': 'id-ID,en-US;q=0.8',
				'x-rpc-language': 'id-id',
				'x-rpc-app_version': getHoyolabV(server),
				'x-rpc-client_type': '5',
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36',
				Cookie: COOKIE,
		  } /* eslint-disable-line */
		: {
				DS: getDS(server, { query, body }),
				Origin: 'https://webstatic.mihoyo.com',
				'x-rpc-app_version': getHoyolabV(server),
				'User-Agent': `Mozilla/5.0 (Linux; Android 9; Unspecified Device) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/39.0.0.0 Mobile Safari/537.36 miHoYoBBS/${getHoyolabV(
					server,
				)}`,
				'x-rpc-client_type': '5',
				Referer: 'https://webstatic.mihoyo.com/app/community-game-records/index.html?v=6',
				'Accept-Encoding': 'gzip, deflate',
				'Accept-Language': 'id-ID,en-US;q=0.8',
				'X-Requested-With': 'com.mihoyo.hyperion',
				Accept: 'application/json, text/plain, */*',
				Cookie: COOKIE,
		  }; /* eslint-disable-line */
};

export const request = async (method, path, data, server) => {
	let query;
	let body;

	if (method.toLowerCase() === 'get') {
		query = data;
	} else {
		body = data;
	}

	const { data: dataRaw } = await axios({
		method,
		url: path.startsWith('http') ? path : `${API_ENDPOINT(server)}${path}`,
		headers: requestHeaders(server, { query, body }),
		data: body,
		params: query,
		...(server === 'os' ? { withCredentials: true } : {}),
	});

	return dataRaw;
};
