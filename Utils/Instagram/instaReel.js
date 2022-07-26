import qs from "qs";

export const getReels = (url) =>
	new Promise(async (resolve) => {
		try {
			url = PARSE_URL(url);
			const data = await fetchTEXT(URL_BASE(), {
				method: "get",
				headers: {
					"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
					Cookie: "PHPSESSID=hj2p3i96va7kqs7csbq16a5tip; _ga=GA1.2.1623964880.1642090612; _gid=GA1.2.553723423.1642090612; _gat=1",
				},
			});
			const $ = cheerioLOAD(data);
			const token = $("input#token").attr("value");
			const dataResult = await fetchJSON(URL_POST(), {
				method: "POST",
				headers: {
					"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
					origin: "https://www.instagramsave.com",
					referer: "https://www.instagramsave.com/reels-downloader.php",
					"Content-Type": `application/x-www-form-urlencoded; charset=UTF-8`,
					Cookie: "PHPSESSID=hj2p3i96va7kqs7csbq16a5tip; _ga=GA1.2.1623964880.1642090612; _gid=GA1.2.553723423.1642090612; _gat=1",
				},
				body: qs.stringify({
					action: "post",
					token,
					url,
				}),
			});
			resolve(dataResult);
		} catch (err) {
			log(err);
			resolve({ status: false, error: err.message });
		}
	});

const URL_BASE = () => "https://www.instagramsave.com/reels-downloader.php";
const URL_POST = () => "https://www.instagramsave.com/system/action.php";
const PARSE_URL = (url) => {
	const regUrl = url.match(/([-_0-9A-Za-z]{11})/) || undefined;
	if (regUrl) return `https://www.instagram.com/reel/${regUrl[0]}`;
	return undefined;
};
