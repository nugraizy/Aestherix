import fs from "fs";
import { spawn, exec } from "child_process";
import path from "path";
import moment from "moment-timezone";
import FormData from "form-data";
import petting from "pet-pet-gif";
import { __dirname } from "../../connect.js";
import { webp2mp4File } from "./EZGifs/index.js";
import { writeBuffer, unlinkFile, INFOLOG, ERRLOG, color, isURL, readBuffer, isFileExist, readJSON } from "../../Helper/Modules/index.js";
const VIDEO_MIMETYPE = readJSON(path.join(__dirname, "Databases/Mimetypes/Video.json"));

export const toOpus = (ext, opts = {}) =>
	new Promise(async (resolve, reject) => {
		let container;
		let tmp;
		if (typeof opts.media == "string" && isURL(opts.media)) {
			tmp = `${opts.input}.${ext}`;
			container = ["-y", "-i", opts.media, "-vn", "-c:a", "libopus", "-b:a", "128k", "-vbr", "on", "-compression_level", "10", `${opts.output}.${ext}`];
		} else {
			tmp = `${opts.input}.${ext}`;
			if (Buffer.isBuffer(opts.media)) writeBuffer(tmp, opts.media);
			container = ["-y", "-i", tmp, "-vn", "-c:a", "libopus", "-b:a", "128k", "-vbr", "on", "-compression_level", "10", `${opts.output}.${ext}`];
		}
		spawn("ffmpeg", container)
			.on("error", reject)
			.on("error", () => unlinkFile(tmp))
			.on("close", () => {
				unlinkFile(tmp);
				resolve(readBuffer(`${opts.output}.${ext}`));
				unlinkFile(`${opts.output}.${ext}`);
			});
	});

export const convertMediaToSticker = (filePath, sender, output, mimetype) =>
	new Promise((resolve, reject) => {
		const time = moment().format("HH:mm:ss DD/MM");
		const pathExif = path.join(__dirname, "Temporary Files/data.exif");
		let pathSticker = filePath;
		if (!isFileExist(pathSticker)) pathSticker = path.join(__dirname, `Temporary Files/${pathSticker}`);
		INFOLOG(`[${color(time, "cyan")}]`, `${color(`Converting Media`, "#01cdfe")} for ${color(sender, "#ff71ce")}`);
		if (filePath.endsWith("webp") && isFileExist(filePath)) {
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
			pathSticker = output ? output : pathSticker;
			exec(
				`ffmpeg -i "${filePath}" ${
					!pathSticker.includes(".webp") ? `-vcodec libwebp -vf "scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,setsar=1,fps=fps=10" -lossless 0 -preset default -ss 00:00:00 -t 00:00:10 -an -vsync 0 -s 512:512` : ""
				} "${mimetype && VIDEO_MIMETYPE.includes(mimetype) ? `${pathSticker}.webp` : pathSticker}"`,
				(er, stdout, stderr) => {
					if (er) {
						ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Convert Media to Sticker", "red")} for ${color(sender, "#ff71ce")}`);
						unlinkFile(pathSticker);
						reject(er);
					}
					exec(`webpmux -set exif "${pathExif}" "${VIDEO_MIMETYPE.includes(mimetype) ? `${pathSticker}.webp` : pathSticker}" -o "${pathSticker}-done.webp"`, (err, stdout, stderr) => {
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

export const convertStickerToMedia = (filePath, sender, mediaData) =>
	new Promise(async (resolve, reject) => {
		const time = moment().format("HH:mm:ss DD/MM");
		const pathResults = path.join(__dirname, "Temporary Files/Sticker-Conversion.png");
		if (mediaData.isAnimated) {
			const { result } = await webp2mp4File(filePath);
			INFOLOG(`[${color(time, "cyan")}]`, `${color(`Converted Media`, "#01cdfe")} for ${color(sender, "#ff71ce")}`);
			unlinkFile(filePath);
			resolve({
				result,
			});
		} else {
			exec(`dwebp '${filePath}' -o '${pathResults}'`, async (err) => {
				if (err) {
					const { result } = await webp2mp4File(filePath);
					INFOLOG(`[${color(time, "cyan")}]`, `${color(`Converted Media`, "#01cdfe")} for ${color(sender, "#ff71ce")}`);
					unlinkFile(filePath);
					resolve({
						result,
					});
					return;
				}
				const buffer = readBuffer(pathResults);
				unlinkFile(pathResults);
				unlinkFile(filePath);
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Converted Media`, "#01cdfe")} for ${color(sender, "#ff71ce")}`);
				resolve({
					result: buffer,
				});
			});
		}
	});

export const mp42mp3 = (input, output, sender) =>
	new Promise(async (resolve, reject) => {
		const time = moment().format("HH:mm:ss DD/MM");
		exec(`ffmpeg -i "${input}" "${output.slice(-3) != "mp3" ? `${output}.mp3` : output}"`, (err, stdout, stderr) => {
			if (err) {
				ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Convert Video to Audio", "red")} for ${color(sender, "#ff71ce")}`);
				reject(err);
				return;
			}
			INFOLOG(`[${color(time, "cyan")}]`, `${color(`Converted Media`, "#01cdfe")} for ${color(sender, "#ff71ce")}`);
			resolve({ output: `${output.slice(-3) != "mp3" ? `${output}.mp3` : output}` });
		});
	});

export const gif2mp4 = (input, output, opts = {}) =>
	new Promise((resolve, reject) => {
		const time = moment().format("HH:mm:ss DD/MM");
		exec(`ffmpeg -stream_loop -1 -i "${input}" -vcodec libx264 -acodec libmp3lame -pix_fmt yuv420p -crf 23 -ss 00:00:00.000 -t 00:00:${opts.duration || 4}.000 "${output}"`, (err, stdout, stderr) => {
			if (err) {
				ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Convert Video to Video", "red")}`);
				reject(err);
				return;
			}
			INFOLOG(`[${color(time, "cyan")}]`, `${color(`Converted Media`, "#01cdfe")}`);
			resolve({ output: `${output}` });
		});
	});

export const soundRemover = (input, sender) =>
	new Promise(async (resolve, reject) => {
		const time = moment().format("HH:mm:ss DD/MM");
		try {
			const bodyForm = new FormData();
			bodyForm.append("fileName", fs.createReadStream(input));
			const data = await fetchJSON("https://aivocalremover.com/api/v2/FileUpload", { method: "post", body: bodyForm, headers: { "Content-Type": `multipart/form-data; boundary=${bodyForm._boundary}` } });
			const { vocal_path: vocal, instrumental_path: instrumental } = await fetchJSON("https://aivocalremover.com/api/v2/ProcessFile", {
				method: "post",
				body: `file_name=${data.file_name}&action=watermark_video&key=X9QXlU9PaCqGWpnP1Q4IzgXoKinMsKvMuMn3RYXnKHFqju8VfScRmLnIGQsJBnbZFdcKyzeCDOcnJ3StBmtT9nDEXJn`,
				headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
			});
			unlinkFile(input);
			INFOLOG(`[${color(time, "cyan")}]`, `${color(`Removed Sound`, "#01cdfe")} for ${color(sender, "#ff71ce")}`);
			resolve({ result: { vocal, instrumental } });
		} catch (err) {
			log(err);
			ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Remove Sound", "red")} for ${color(sender, "#ff71ce")}`);
			reject(err);
		}
	});

export const pet = (input, sender, opts = {}) =>
	new Promise(async (resolve, reject) => {
		const time = moment().format("HH:mm:ss DD/MM");
		try {
			const tempInput = input;
			const petted = await petting(input, opts);
			input = opts.filename ? `${opts.filename}` : `${input}.gif`;
			writeBuffer(`${input}.gif`, petted);
			if (opts.output == "sticker") {
				const sticker = await convertMediaToSticker(`${input}.gif`, sender, undefined, "video/mp4");
				resolve(sticker);
				unlinkFile(input);
				unlinkFile(tempInput);
				unlinkFile(`${input}.gif`);
				return;
			}
			const { output } = await gif2mp4(`${input}.gif`, `${input}.mp4`, opts);
			resolve(readBuffer(output));
			unlinkFile(input);
			unlinkFile(tempInput);
			unlinkFile(`${input}.gif`);
			unlinkFile(output);
		} catch (err) {
			ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Pet Image", "red")} for ${color(sender, "#ff71ce")}`);
			reject(err);
		}
	});
