export const _baseApi = 'https://i.instagram.com';
export const _baseUrl = 'https://www.instagram.com';
export const _apiUser = (input) => `${_baseApi}/api/v1/users/web_profile_info/?username=${input}`;
export const _apiGraphql = `${_baseUrl}/graphql/query/?`;

export const USER_AGENTS = {
	LOGIN_AGENT: 'Instagram 134.0.0.26.121 Android',
	LOGIN_MOBILE:
		'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
	NON_LOGIN_AGENT:
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
};
export const LOGIN_HEADERS = {
	'User-Agent': USER_AGENTS.LOGIN_AGENT,
	'Content-Type': 'application/x-www-form-urlencoded',
	'Accept-Language': 'en-US,en;q=0.9',
	authority: 'www.instagram.com',
	'content-type': 'application/x-www-form-urlencoded',
	origin: _baseUrl,
	'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
	'sec-fetch-site': 'same-origin',
	'sec-fetch-mode': 'cors',
	'sec-fetch-dest': 'empty',
	'x-ig-app-id': '936619743392459',
	'x-ig-www-claim': 'hmac.AR2uidim8es5kYgDiNxY0UG_ZhffFFSt8TGCV5eA1VYYsMNx',
	'x-requested-with': 'XMLHttpRequest'
};

export const generateDeviceID = () => `android-${(Math.random() * 1e24).toString(36)}`;
