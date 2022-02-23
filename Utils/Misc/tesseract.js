import moment from "moment-timezone";
import Tesseract from "tesseract.js";
import fetch from "node-fetch";
import cheerio from "cheerio";
import { INFOLOG, color, unlinkFile } from "../../Helper/Modules/index.js";

export const tesseract = async (image, sender, lang = "ind") =>
	new Promise(async (resolve, reject) => {
		try {
			if (lang == "") lang = "ind";
			const time = moment().format("HH:mm:ss DD/MM");
			const languages = [];
			const $ = cheerio.load(await (await fetch("https://github.com/tesseract-ocr/tessdoc/blob/main/Data-Files-in-different-versions.md")).text());
			$("#readme > article > table:nth-child(2) > tbody > tr").each(function () {
				if ($(this).find("td:nth-child(1)").text() === "") return;
				languages.push({
					code: $(this).find("td:nth-child(1)").text(),
					name: $(this).find("td:nth-child(2)").text(),
				});
			});
			if (!languages.some((l) => l.code === lang)) {
				unlinkFile(image);
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Language ${lang} is not supported`, "red")}`);
				reject({ error: `Language ${lang} not found`, languages });
				return;
			}
			INFOLOG(`[${color(time, "cyan")}]`, `${color(`Recognizing the image..`, "#01cdfe")} to ${color(sender, "#ff71ce")}`);
			let {
				data: { text, confidence, paragraphs },
			} = await Tesseract.recognize(image, lang);
			unlinkFile(image);
			resolve({ result: { text, confidence, paragraphs: paragraphs.map((v) => v.text), languages } });
		} catch (err) {
			unlinkFile(image);
			reject({ error: err });
		}
	});
