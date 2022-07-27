import Canvas from "canvas";
import moment from "moment-timezone";
import GIFEncoder from "gifencoder";
import sharp from "sharp";
import { convertMediaToSticker } from "../../Utils/Converter/index.js";
import { unlinkFile, ERRLOG, color, isURL, readBuffer } from "../../Helper/Modules/index.js";
const { createCanvas, loadImage } = Canvas;
const { fit } = sharp;
const width = 640;
const height = 640 + 54;
const BR = 30 * 2.8;
const LR = 20 * 2.8;

export const trigger = async (image, sender, opt) =>
	new Promise(async (resolve, reject) => {
		const time = moment().format("HH:mm:ss DD/MM");
		try {
			const GIF = new GIFEncoder(width, height);
			GIF.start();
			GIF.setRepeat(0);
			GIF.setDelay(15);
			const { base, image: images, ctx } = await prepareCanvas(image);
			let i = 0;
			while (i < 9) {
				ctx.clearRect(0, 0, width, height);
				ctx.drawImage(images, Math.floor(Math.random() * BR) - BR, Math.floor(Math.random() * BR) - BR, width + BR, height - 54 + BR);
				ctx.fillStyle = "#FF000033";
				ctx.fillRect(0, 0, width, height);
				ctx.drawImage(base, Math.floor(Math.random() * LR) - LR, height - 54 + Math.floor(Math.random() * LR) - LR, width + LR, 54 + LR);
				GIF.addFrame(ctx);
				i++;
			}
			GIF.finish();
			const buffer = GIF.out.getData();
			if (opt.output == "sticker") {
				await sharp(buffer, { animated: true })
					.resize(width, height - 54, {
						fit: fit.contain,
						background: { r: 0, g: 0, b: 0, alpha: 0 },
					})
					.toFile(`${isURL(image) ? `./Temporary Files/${sender}` : image}.webp`);
				const results = await convertMediaToSticker(`${isURL(image) ? `./Temporary Files/${sender}` : image}.webp`, sender, undefined);
				unlinkFile(`${isURL(image) ? `./Temporary Files/${sender}` : image}.webp`);
				unlinkFile(`${isURL(image) ? `./Temporary Files/${sender}` : image}`);
				resolve(results);
			} else {
				writeBuffer(`${filename}gif`, buffer);
				const { output } = await gif2mp4(`${filename}.gif`, `${filename}.mp4`, opt);
				resolve(readBuffer(output));
				unlinkFile(`${filename}.gif`);
				unlinkFile(`${filename}.mp4`);
				unlinkFile(`${isURL(image) ? `./Temporary Files/${sender}` : image}`);
				unlinkFile(`${isURL(image) ? `./Temporary Files/${sender}` : image}.webp`);
			}
		} catch (err) {
			ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Trigger an image", "red")} for ${color(sender, "#ff71ce")}`);
			reject(err);
		}
	});

const prepareCanvas = async (images) => {
	const TRIGGERED = readBuffer("./Media Files/triggered.png");
	const base = await loadImage(TRIGGERED);
	const image = await loadImage(images);
	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext("2d");
	return {
		base,
		image,
		ctx,
	};
};
