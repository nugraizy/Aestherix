import fs from "fs";
import { spawn, exec } from "child_process";
import path from "path";
import moment from "moment-timezone";
import { __dirname } from "../../index.js";

export function toOpus(ext, opts = {}) {
	return new Promise(async (resolve, reject) => {
		let container;
		let tmp;
		const { isURL } = await import("../../Helper/Modules/functions.js");
		if (typeof opts.media == "string" && isURL(opts.media)) {
			tmp = `${opts.input}.${ext}`;
			container = ["-y", "-i", opts.media, "-vn", "-c:a", "libopus", "-b:a", "128k", "-vbr", "on", "-compression_level", "10", `${opts.output}.${ext}`];
		} else {
			tmp = `${opts.input}.${ext}`;
			fs.writeFileSync(tmp, opts.media);
			container = ["-y", "-i", tmp, "-vn", "-c:a", "libopus", "-b:a", "128k", "-vbr", "on", "-compression_level", "10", `${opts.output}.${ext}`];
		}
		spawn("ffmpeg", container)
			.on("error", reject)
			.on("error", () => fs.unlinkSync(tmp))
			.on("close", () => {
				if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
				resolve(fs.readFileSync(`${opts.output}.${ext}`));
				if (fs.existsSync(`${opts.output}.${ext}`)) fs.unlinkSync(`${opts.output}.${ext}`);
			});
	});
}

export function convertMediaToSticker(filePath, sender) {
	return new Promise(async (resolve, reject) => {
		const time = moment().format("HH:mm:ss DD/MM");
		const pathExif = path.join(__dirname, "Temporary Files/data.exif");
		const pathSticker = filePath;
		const { readBuffer, unlinkFile, INFOLOG, ERRLOR, color } = await import("../../Helper/Modules/functions.js");
		INFOLOG(`[${color(time, "cyan")}]`, `${color(`Converting Media`, "#01cdfe")} for ${color(sender, "#ff71ce")}`);
		if (filePath.endsWith("webp")) {
			exec(`webpmux -set exif "${pathExif}" "${pathSticker}" -o "${pathSticker}-done.webp"`, (err, stdout, stderr) => {
				if (err) {
					ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Convert Media to Sticker", "red")} for ${color(sender, "#ff71ce")}`);
					unlinkFile(pathSticker);
					reject(err);
				}
				const buffer = readBuffer(`${pathSticker}-done.webp`);
				unlinkFile(`${pathSticker}-done.webp`);
				unlinkFile(pathSticker);
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Converted Media`, "#01cdfe")} for ${color(sender, "#ff71ce")}`);
				resolve(buffer);
			});
		} else if (filePath.endsWith("jpeg")) {
			exec(`ffmpeg -i "${pathSticker}" -vcodec libwebp -vf "scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,setsar=1,fps=fps=30" -lossless 0 -an -vsync 0 -s 512:512 "${pathSticker}.webp"`, (err, stdout, stderr) => {
				if (err) {
					ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Convert Media to Sticker", "red")} for ${color(sender, "#ff71ce")}`);
					unlinkFile(pathSticker);
					reject(err);
				}
				exec(`webpmux -set exif "${pathExif}" "${pathSticker}.webp" -o "${pathSticker}-done.webp"`, (err, stdout, stderr) => {
					if (err) {
						ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Convert Media to Sticker", "red")} for ${color(sender, "#ff71ce")}`);
						unlinkFile(`${pathSticker}-done.webp`);
						unlinkFile(pathSticker);
						unlinkFile(`${pathSticker}.webp`);
						reject(err);
					}
					const buffer = readBuffer(`${pathSticker}-done.webp`);
					unlinkFile(`${pathSticker}-done.webp`);
					unlinkFile(pathSticker);
					unlinkFile(`${pathSticker}.webp`);
					INFOLOG(`[${color(time, "cyan")}]`, `${color(`Converted Media`, "#01cdfe")} for ${color(sender, "#ff71ce")}`);
					resolve(buffer);
				});
			});
		} else {
			exec(
				`ffmpeg -i "${pathSticker}" -vcodec libwebp -vf "scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,setsar=1,fps=fps=10" -lossless 0 -preset default -ss 00:00:00 -t 00:00:10 -an -vsync 0 -s 512:512 "${pathSticker}.webp"`,
				(err, stdout, stderr) => {
					if (err) {
						ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Convert Media to Sticker", "red")} for ${color(sender, "#ff71ce")}`);
						unlinkFile(pathSticker);
						reject(err);
					}
					exec(`webpmux -set exif "${pathExif}" "${pathSticker}.webp" -o "${pathSticker}-done.webp"`, (err, stdout, stderr) => {
						if (err) {
							ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Convert Media to Sticker", "red")} for ${color(sender, "#ff71ce")}`);
							unlinkFile(pathSticker);
							reject(err);
						}
						const buffer = readBuffer(`${pathSticker}-done.webp`);
						unlinkFile(`${pathSticker}-done.webp`);
						unlinkFile(pathSticker);
						unlinkFile(`${pathSticker}.webp`);
						INFOLOG(`[${color(time, "cyan")}]`, `${color(`Converted Media`, "#01cdfe")} for ${color(sender, "#ff71ce")}`);
						resolve(buffer);
					});
				},
			);
		}
	});
}
