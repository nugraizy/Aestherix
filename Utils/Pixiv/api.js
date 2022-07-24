import fetch from "node-fetch";
const _fetch = async (_) => {
	return await (await fetch(_)).json();
};
const URL_API_DOWNLOAD_MANGA = (input) => `https://www.pixiv.net/ajax/illust/${input}/pages?lang=en`;
const URL_API_DOWNLOAD_MANGA_DETAIL = (input) => `https://www.pixiv.net/ajax/illust/${input}`;
const URL_API_DOWNLOAD_ARTWORKS = (input) => `https://www.pixiv.net/ajax/illust/${input}`;
const URL_API_CONTENT_NOVEL = (input) => `https://www.pixiv.net/ajax/novel/${input}`;
const URL_API_SEARCH_MANGA = (keyword) => `https://www.pixiv.net/ajax/search/manga/${encodeURIComponent(keyword)}?word=${encodeURIComponent(keyword)}&order=date_d&mode=safe&p=1&s_mode=s_tag&type=manga&work_lang=en&lang=en`;
const URL_API_SEARCH_NOVEL = (keyword) => `https://www.pixiv.net/ajax/search/novels/${encodeURIComponent(keyword)}?word=${encodeURIComponent(keyword)}&order=date_d&mode=all&p=1&s_mode=s_tag&gs=0&lang=en`;
const URL_API_SEARCH_ARTWORKS = (keyword) => `https://www.pixiv.net/ajax/search/artworks/${encodeURIComponent(keyword)}?word=${encodeURIComponent(keyword)}&order=date_d&mode=all&p=1&s_mode=s_tag&type=all&lang=en`;
export { URL_API_DOWNLOAD_MANGA, URL_API_DOWNLOAD_ARTWORKS, URL_API_CONTENT_NOVEL, URL_API_SEARCH_MANGA, URL_API_SEARCH_NOVEL, URL_API_SEARCH_ARTWORKS, URL_API_DOWNLOAD_MANGA_DETAIL, _fetch };
