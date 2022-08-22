import FormData from "form-data";
import { createReadStream } from "fs";
import { isURL } from "../../Helper/Modules/index.js";

const isValidImageURL = async (url) => {
	try {
		const data = await fetch(url.replace("https:", "http:"));
		if (data.status !== 200) {
			return false;
		}
		return true;
	} catch (error) {
		return false;
	}
};

export const sauceNao = async (file) =>
	new Promise(async (resolve) => {
		try {
			let data = null;
			if (!isURL(file)) {
				const form = new FormData();
				form.append("file", createReadStream(file));
				const response = await new Promise((resolve, reject) => {
					form.submit(URL_BASE(), (err, res) => {
						if (err) {
							reject(err);
						} else {
							resolve(res);
						}
					});
				});
				response.setEncoding("utf-8");
				data = "";
				response.on("data", (v) => (data += v));
				await new Promise((r) => response.on("end", r));
			} else if (isURL(file) && !(await isValidImageURL(file))) {
				return resolve({ error: "Invalid image URL" });
			}
			data = data ?? (await fetchTEXT(URL_BASE_INPUT(file)));
			const $ = cheerioLOAD(data);
			const result = $("#middle > div:nth-child(2)");
			const results = {
				title: result.find("div.resulttitle > strong").text(),
				description: result.find("div.resulttitle").text(),
				similarity: Number(result.find("div.resultmatchinfo > div.resultsimilarityinfo").text().replace("%", "")),
				MAL: result.find("div.resultmatchinfo > div.resultmiscinfo > a:nth-child(4)").attr("href"),
			};
			if (!results.MAL) {
				delete results.MAL;
			}
			resolve(results);
		} catch (error) {
			resolve({ error: error.message });
		}
	});

const URL_BASE = () => `https://saucenao.com/search.php`;
const URL_BASE_INPUT = (input) => `https://saucenao.com/search.php?url=${input}`;
