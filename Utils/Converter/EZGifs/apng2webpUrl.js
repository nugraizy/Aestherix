import cheerio from "cheerio";
import FormData from "form-data";

export const apng2webpUrl = (url) =>
	new Promise(async (resolve) => {
		try {
			const data = await fetchTEXT(`https://ezgif.com/apng-to-webp?url=${url}`);
			const $ = cheerioLOAD(data);
			const bodyFormThen = new FormData();
			const file = $('input[name="file"]').attr("value");
			const convert = $('input[name="file"]').attr("value");
			const gotdata = { file, convert };
			bodyFormThen.append("file", gotdata.file);
			bodyFormThen.append("convert", gotdata.convert);
			const dataResult = await fetchTEXT(`https://ezgif.com/apng-to-webp/${gotdata.file}`, { method: "post", body: bodyFormThen, headers: { "Content-Type": `multipart/form-data; boundary=${bodyFormThen._boundary}` } });
			const $$ = cheerioLOAD(dataResult);
			const result = `https:${$$("div#output > p.outfile > img").attr("src")}`;
			resolve({
				result,
			});
		} catch (err) {
			resolve(err);
		}
	});
