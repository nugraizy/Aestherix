import Axios from "axios";
import crypto from "crypto";
import moment from "moment-timezone";
import { INFOLOG, color } from "../../Helper/Modules/index.js";

const RANDOM_UA = (await import("../../Helper/Misc/User-Agent/ua.js")).UA();
const MOBILE_UA = "Instagram 100.1.0.29.135 Android";
const URL_LOGIN_GET = "https://i.instagram.com/api/v1/si/fetch_headers/?challenge_type=signup";
const URL_LOGIN_POST = `https://i.instagram.com/api/v1/accounts/login/`;
const LOGIN_HEADERS = {
	"User-Agent": MOBILE_UA,
	"Content-Type": "application/x-www-form-urlencoded",
	"Accept-Language": "en-US,en;q=0.9",
	Cookie: "",
};

export const getCookie = (username, password) =>
	new Promise(async (resolve) => {
		try {
			const time = moment().format("HH:mm:ss DD/MM");
			INFOLOG(`[${color(time, "cyan")}]`, `${color(`Getting Instagram Cookies.`, "#01cdfe")}`);
			const REQUESTED_HEADERS = await Axios.get(URL_LOGIN_GET);
			LOGIN_HEADERS.Cookie = REQUESTED_HEADERS.headers["set-cookie"].map((x) => x.match(/(.*?=.*?);/)?.[1])?.join("; ");
			const LOGGED_IN_HEADERS = await Axios.post(URL_LOGIN_POST, `username=${username}&password=${password}&device_id=${crypto.randomUUID()}&login_attempt_count=0`, {
				headers: LOGIN_HEADERS,
			});
			const FINAL_COOKIE = LOGGED_IN_HEADERS.headers["set-cookie"].map((x) => x.match(/(.*?=.*?);/)?.[1])?.join("; ");
			resolve(FINAL_COOKIE);
		} catch (e) {
			log(e);
		}
	});
