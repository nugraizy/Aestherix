import axios from 'axios';
import crypto from 'crypto';

import { color, INFOLOG } from '../modules/index.js';

const userAgent = 'Instagram 100.1.0.29.135 Android';
const _apiLoginResponse = 'https://i.instagram.com/api/v1/si/fetch_headers/?challenge_type=signup';
const _apiLoginPost = 'https://i.instagram.com/api/v1/accounts/login/';
const _loginHeaders = {
	'User-Agent': userAgent,
	'Content-Type': 'application/x-www-form-urlencoded',
	'Accept-Language': 'en-US,en;q=0.9',
	Cookie: ''
};

export const getCookie = (username, password) =>
	new Promise(async (resolve) => {
		try {
			if (!username || !password) {
				return;
			}

			INFOLOG(`${color('Getting Instagram Cookies.', 'cyan')}`);
			const requestedHeaders = await axios.get(_apiLoginResponse);

			_loginHeaders.Cookie = requestedHeaders.headers['set-cookie'].map((x) => x.match(/(.*?=.*?);/)?.[1])?.join('; ');
			const loggedInHeaders = await axios.post(
				_apiLoginPost,
				`username=${username}&password=${password}&device_id=${crypto.randomUUID()}&login_attempt_count=0`,
				{
					headers: _loginHeaders
				}
			);
			const finalCookie = loggedInHeaders.headers['set-cookie'].map((x) => x.match(/(.*?=.*?);/)?.[1])?.join('; ');

			resolve(finalCookie);
		} catch (e) {
			log(e);
		}
	});
