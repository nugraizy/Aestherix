import Canvas from "canvas";
import { writeFileSync, unlinkSync, readFileSync } from "fs";
import Wrap from "canvas-text-wrapper";
import { spawn, exec } from "child_process";
import path from "path";
import moment from "moment-timezone";
import { createExif } from "../../Utils/Misc/index.js";
import { __dirname } from "../../connect.js";
import { scheme } from "../Misc/Palettes/colors.js";
import { INFOLOG, ERRLOG, color } from "../Modules/functions.js";
const { createCanvas, registerFont } = Canvas;
const { CanvasTextWrapper } = Wrap;

export async function ttp(sender, texts, colors, fonts) {
	const time = moment().format("HH:mm:ss DD/MM");
	fonts = fonts !== undefined ? fonts.toLowerCase() : "chevin";
	colors = colors.length == 0 ? null : colors;
	INFOLOG(`[${color(time, "cyan")}]`, `${color(`Making Static Image`, "#01cdfe")} for ${color(sender, "#ff71ce")}`);
	const color = await loadColorsPalette(colors);
	let { ctx, canvas } = createCanvasTemplates(fonts);
	const reassignColor = color.startsWith("#") ? color : `#${color}`;
	ctx.fillStyle = reassignColor;
	ctx.shadowOffsetX = 1;
	ctx.shadowOffsetY = 1;
	ctx.shadowColor = reassignColor;
	ctx.shadowBlur = 2;
	CanvasTextWrapper(canvas, texts.trim(), { font: `48px ${fonts}`, textAlign: "center", verticalAlign: "middle", sizeToFill: true });
	const buffer = canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
	const saved = saveImages(new Buffer.from(buffer, "base64"), sender);
	const { buffers } = await insertExif(saved, sender);
	INFOLOG(`[${color(time, "cyan")}]`, `${color(`Static Image is Done`, "#01cdfe")} for ${color(sender, "#ff71ce")}`);
	return buffers;
}

const saveImages = (buffer, sequence) => {
	const paths = `Temporary Files/Static Images-${sequence}.png`;
	const fileName = path.join(__dirname, paths);
	writeFileSync(fileName, buffer);
	return fileName;
};

const insertExif = async (paths, sender) =>
	new Promise(async (resolve, reject) => {
		const time = moment().format("HH:mm:ss DD/MM");
		const pathExif = path.join(__dirname, "Temporary Files/data.exif");
		const pathResults = path.join(__dirname, `Temporary Files/Static Images-${Date.now()}`);
		createExif("Made by Nanda", "Void Static Sticker using Canvas and WebP");
		const commands = [paths, "-o", `${pathResults}.webp`];
		spawn("img2webp", commands)
			.on("error", (err) => {
				ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Convert Media to Sticker", "red")} for ${color(sender, "#ff71ce")}`);
				reject(err);
			})
			.on("close", async () => {
				exec(`webpmux -set exif '${pathExif}' '${pathResults}.webp' -o '${pathResults}-done.webp'`, (err, stdout, stderr) => {
					if (err) {
						log(err);
						ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Convert Media to Sticker", "red")} for ${color(sender, "#ff71ce")}`);
						reject(err);
					}
					const buffers = readFileSync(`${pathResults}-done.webp`);
					unlinkSync(`${pathResults}-done.webp`);
					unlinkSync(`${pathResults}.webp`);
					unlinkSync(paths);
					resolve({
						buffers,
					});
				});
			});
	});

const createCanvasTemplates = (fonts) => {
	if (fonts == "chevin") registerFont("./Media Files/Fonts/Chevin Bold.ttf", { family: "chevin" });
	if (fonts == "texgy") registerFont("./Media Files/Fonts/texgyreadventor-bold.otf", { family: "texgy" });
	if (fonts == "sanspro") registerFont("./Media Files/Fonts/SourceSansPro-Italic.ttf", { family: "sanspro" });
	if (fonts == "calm") registerFont("./Media Files/Fonts/KeepCalm-Medium.ttf", { family: "calm" });
	const canvas = createCanvas(360, 360);
	const ctx = canvas.getContext("2d");
	return { ctx, canvas };
};

const loadColorsPalette = async (color = null) => {
	const defaultColors = [
		["047af6", "7401df", "202532", "32fa00", "ff00d5"],
		["4db1c3", "046084", "35b07e", "f0a7aa", "e74758"],
		["ffffff", "f7a9ef", "f881ec", "f751e6", "c400b0"],
		["ffaf39", "ee7e1b", "ef421b", "cf214b", "bf1679"],
		["86ff5d", "34e361", "14d285", "0ebb9b", "0c9ea9"],
		["e0f4ff", "cbecff", "afe2ff", "afd5ff", "afc8ff"],
		["d2dbde", "8debff", "84b7ff", "b8b8b8", "08e1ff"],
		["ffef2b", "2f4af4", "ee1c62", "33ee87", "6cfcff"],
		["6500ff", "ffe04e", "8b00ff", "bd93ed", "7400ff"],
		scheme().map((v) => v.replace("#", "")), // for more randomize
	];
	if (color) {
		return random(color);
	}
	return random([].concat(...Array(3).fill(defaultColors[Math.floor(Math.random() * defaultColors.length)])));
};

const random = (input) => input[Math.floor(Math.random() * input.length)];

//log(await fetch("https://wallpaperflare.com").then((res) => res.text()));
//log(await fetch("https://deviantart.com").then((res) => res.text()));
