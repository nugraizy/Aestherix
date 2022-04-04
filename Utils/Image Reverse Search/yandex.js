import fetch from "node-fetch";
import cheerio from "cheerio";
import { isURL, uploadToTelegraph } from "../../Helper/Modules/index.js";

const isValidImageURL = async (url) => {
	try {
		const data = await fetch(url.replace("https:", "http:"));
		if (data.status !== 200) return false;
		return true;
	} catch (error) {
		return false;
	}
};

export const yandex = async (file, { limit = 20 } = {}) =>
	new Promise(async (resolve) => {
		try {
			if (!isURL(file)) file = await uploadToTelegraph(file);
			else if (isURL(file) && !(await isValidImageURL(file))) return resolve({ error: "Invalid image URL" });
			const dataInformation = await (await fetch(URL_BASE(file))).text();
			const dataImages = await (await fetch(`${URL_BASE(file)}&cbir_page=similar`)).text();
			const $images = cheerio.load(dataImages);
			const $information = cheerio.load(dataInformation);
			const now = new Date();
			const container = { status: "OK", responseTime: 0, information: [] };
			$information("div.CbirSites-Items > div.CbirSites-Item").each(function () {
				if (container.information.length >= limit && limit !== "infinite") return;
				const title = $information(this).find("div.CbirSites-ItemInfo > div.CbirSites-ItemTitle").text();
				const description = $information(this).find("div.CbirSites-ItemInfo > div.CbirSites-ItemDescription").text() || "NO DESCRIPTION";
				container.information.push({ images: "", title, description });
			});
			$images("div > a.serp-item__link > img.serp-item__thumb.justifier__thumb").each((i, el) => {
				if (container.information[i] == undefined) return;
				const images = `https:${$images(el).attr("src")}`;
				container.information[i].images = images;
			});
			container.responseTime = (new Date() - now) / 1000;
			resolve(container);
		} catch (error) {
			resolve({ error: error.message });
		}
	});

const URL_BASE = (input) => `https://yandex.com/images/search?rpt=imageview&url=${input}`;
