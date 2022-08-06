import moment from "moment-timezone";
import cheerio from "cheerio";
import Axios from "axios";

const URL_BASE = "https://api.onlinevideoconverter.pro/api/convert";
const FB_DL = "https://snapsave.app/action.php";

export const fbDl = (url) =>
	new Promise(async (resolve, reject) => {
		try {
			const { data } = await Axios(FB_DL, {
				method: "POST",
				headers: {
					"content-type": "application/x-www-form-urlencoded",
					referer: "https://snapsave.app/id",
					"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36",
				},
				data: new URLSearchParams(Object.entries({ url })),
			});
			const decode = data
				.split("decodeURIComponent(escape(r))}(")[1]
				.split("))</script>")[0]
				.split(",")
				.map((v) => v.replace(/"/g, "").trim());
			let html;

			if (!Array.isArray(decode) || decode.length !== 6) html = (typeof data === "string" ? JSON.parse(data) : data)?.data;
			else {
				const decoded = decoding(...decode);
				html = decoded
					?.split('("download-section").innerHTML = "')[1]
					?.split('; parent.document.getElementById("inputData").remove();')[0]
					?.split("</style><section class=")[1]
					.split('"> ')
					?.slice(1)
					?.map((v) => `${v}">`.trim())
					.join()
					?.split("</section><div class=")[0]
					?.replace(/\\(\\)?/g, "");
				if (!html) return resolve({ error: "Cant find downloadable media" });
				const $ = cheerio.load(html);
				let result = [];
				$("table.table > tbody > tr").each(function () {
					const el = $(this).find("td");
					if (/tidak|no/i.test(el.eq(1).text())) {
						const quality = el.eq(0).text().split("(")?.[0]?.trim();
						const url = el.eq(2).find("a[href]").attr("href");
						if (url) result.push({ quality, url });
					}
				});
				if (!result.length) return resolve({ error: "Cant find downloadable media" });
				result = result.filter((v) => v.quality == "1080p" || v.quality == "720p" || v.quality == "480p");
				resolve({
					isVideo: true,
					resolution: result[0].quality,
					url: result[0].url,
				});
			}
		} catch (err) {
			const data = await fetchJSON(URL_BASE, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
			if (data.code == 102) return resolve({ error: data.message });
			let { url, subname } = data.url.filter((x) => x.subname == "HD")?.[0] ?? data.url.filter((x) => x.subname == "SD")?.[0] ?? data.url[0];
			let { duration, title } = data.meta;
			let { timestamp: datePosted } = data;
			return resolve({
				url,
				duration,
				isVideo: title !== "Photo",
				resolution: subname,
				...(duration ? { duration: moment(duration * 1000).format("DD/MM/YYYY HH:mm:ss") } : {}),
				datePosted: moment(datePosted * 1000).format("DD/MM/YYYY HH:mm:ss"),
				rawDatePosted: datePosted * 1000,
			});
		} finally {
			resolve({ error: "Cant find downloadable media" });
		}
	});

const decoding = (...args) => {
	function a(d, e, f) {
		const g = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/".split("");
		const h = g.slice(0, e);
		const i = g.slice(0, f);
		let j = d
			.split("")
			.reverse()
			.reduce((a, b, c) => {
				if (h.includes(b)) return (a += h.indexOf(b) * e ** c);
			}, 0);
		let k = "";
		while (j > 0) {
			k = i[j % f] + k;
			j = (j - (j % f)) / f;
		}
		return k || "0";
	}
	function b(h, u, n, t, e, r) {
		r = "";
		for (let i = 0, len = h.length; i < len; i++) {
			let s = "";
			while (h[i] !== n[e]) {
				s += h[i];
				i++;
			}
			for (let j = 0; j < n.length; j++) s = s.replace(new RegExp(n[j], "g"), j);
			r += String.fromCharCode(a(s, e, 10) - t);
		}
		return decodeURIComponent(encodeURIComponent(r));
	}
	return b(...args);
};
