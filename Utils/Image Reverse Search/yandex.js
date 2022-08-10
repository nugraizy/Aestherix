import fs from "fs";
import fetch from "node-fetch";
import { cheerioLOAD, fetchJSON, fetchTEXT, isURL } from "../../Helper/Modules/index.js";

const isValidImageURL = async (url) => {
	try {
		const data = await fetch(url.replace("https:", "http:"));
		if (data.status !== 200) return false;
		return true;
	} catch (error) {
		return false;
	}
};

const postImage = async (file) => {
	try {
		const { url } = await fetchJSON("https://yandex.com/images-apphost/image-download?cbird=111&images_avatars_size=orig&images_avatars_namespace=images-cbir", {
			method: "post",
			body: fs.readFileSync(file),
			headers: {
				cookie:
					"is_gdpr=0; yandexuid=8061117791646679247; i=TOzP/iLfxpPtpYkc5o5+cmu9eR3EDL5vmX4zTFE1ZwOWXlchamsv/NiInft9B0YjJO7E3Um0LeSfEk5s1tFyQ09b0Hc=; is_gdpr_b=CPrlYRCWZigC; mda=0; my=YwA=; ys=wprid.1646826348600464-10355450763662077070-man1-2641-ced-man-l7-balancer-8080-BAL-672; yandex_gid=10574; bltsr=1; MGphYZof=1; _yasc=sobSth10AqC1wS/0p/c/jfAgad0tDPrJpHcdENiwq6g/q+BF0Ruy9tIiJ1dVUA==;",
			},
		});
		return url;
	} catch (error) {
		return false;
	}
};

export const yandex = async (file, { limit = 20 } = {}) =>
	new Promise(async (resolve) => {
		try {
			if (!isURL(file)) file = await postImage(file);
			else if (isURL(file) && !(await isValidImageURL(file))) return resolve({ error: "Invalid image URL" });
			const dataInformation = await fetchTEXT(URL_BASE(file), {
				headers: {
					cookie:
						"is_gdpr=0; yandexuid=8061117791646679247; i=TOzP/iLfxpPtpYkc5o5+cmu9eR3EDL5vmX4zTFE1ZwOWXlchamsv/NiInft9B0YjJO7E3Um0LeSfEk5s1tFyQ09b0Hc=; is_gdpr_b=CPrlYRCWZigC; mda=0; my=YwA=; ys=wprid.1646826348600464-10355450763662077070-man1-2641-ced-man-l7-balancer-8080-BAL-672; yandex_gid=10574; bltsr=1; MGphYZof=1; _yasc=sobSth10AqC1wS/0p/c/jfAgad0tDPrJpHcdENiwq6g/q+BF0Ruy9tIiJ1dVUA==;",
				},
			});
			const dataImages = await fetchTEXT(`${URL_BASE(file)}&cbir_page=similar`, {
				headers: {
					cookie:
						"is_gdpr=0; yandexuid=8061117791646679247; i=TOzP/iLfxpPtpYkc5o5+cmu9eR3EDL5vmX4zTFE1ZwOWXlchamsv/NiInft9B0YjJO7E3Um0LeSfEk5s1tFyQ09b0Hc=; is_gdpr_b=CPrlYRCWZigC; mda=0; my=YwA=; ys=wprid.1646826348600464-10355450763662077070-man1-2641-ced-man-l7-balancer-8080-BAL-672; yandex_gid=10574; bltsr=1; MGphYZof=1; _yasc=sobSth10AqC1wS/0p/c/jfAgad0tDPrJpHcdENiwq6g/q+BF0Ruy9tIiJ1dVUA==;",
				},
			});
			const $images = cheerioLOAD(dataImages);
			const $information = cheerioLOAD(dataInformation);
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
