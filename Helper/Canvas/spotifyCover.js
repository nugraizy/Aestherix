import Axios from "axios";
import Canvas from "canvas";
import chroma from "chroma-js";
import fs from "fs-extra";
import sharp from "sharp";
import * as color from "colorthief";
import { spotifier } from "../../Utils/Spotifier/Spotify.js";

const { createCanvas, registerFont, loadImage } = Canvas;

export class SpotifyCover {
	constructor() {
		this._track = null;
		this._title = null;
		this._artist = null;
		this._timestamp = null;
		this._buffer = null;
		this._colorPalettes = null;
		this.revertBlack = false;
		this.canvas = null;
		this.ctx = null;
		this.w = null;

		this.init = async (track) => {
			if (this.canvas || this.ctx) {
				throw new Error("Spotify Cover already been initialized.");
			}

			this._track = track;

			await this.getTrackCover();
			await this.palettes();

			if (!this.canvas || !this.ctx) {
				this.initCanvas();
			}

			return this;
		};

		this.fillBackground = (opts) => {
			if (!this.canvas || !this.ctx) {
				throw new Error("Need initialization. Call .init() first.");
			}

			if (typeof opts !== "object" && opts) {
				throw new Error(`Expected opts to be Object. Got : ${typeof opts}`);
			}

			if (!opts) {
				opts = {};
			}

			if (!opts.gradient) {
				opts.gradient = false;
			}

			if (!opts.color) {
				opts.color = this._colorPalettes[0];
			}

			let gradient;
			const random = ~~(Math.random() * 2);

			if (opts.gradient) {
				gradient = this.ctx.createLinearGradient(0, this.canvas.height - 300, this.canvas.width / 1.4, this.canvas.height);

				gradient.addColorStop(0, chroma(this._colorPalettes[random]).darken(0.7).hex());
				gradient.addColorStop(1, chroma(this._colorPalettes[random]).darken(2).hex());
			}

			this.revertBlack = chroma(this._colorPalettes[random]).name() == "white";

			this.ctx.fillStyle = opts.gradient ? gradient : opts.color ? (chroma.valid(opts.color) ? opts.color : chroma(this._colorPalettes[random]).darken(0.7)) : this._colorPalettes[0];
			this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

			return this;
		};

		this.putTrackCover = async (opts) => {
			if (!this.canvas || !this.ctx) {
				throw new Error("Need initialization. Call .init() first.");
			}

			if (!opts) {
				opts = {};
			}

			if (!opts.shadow) {
				opts.shadow = false;
			}

			if (!opts.round) {
				opts.round = false;
			}

			let image = await loadImage(this._buffer);

			this.ctx.save();
			this.ctx.beginPath();
			if (opts.shadow) {
				if (typeof opts.shadow === "boolean") {
					opts.shadow = 10;
				}

				if (typeof opts.shadow !== "number") {
					throw new Error(`Options.shadow expected integer/number. Got : ${typeof opts.shadow}`);
				}

				if (!Number.isInteger(opts.shadow)) {
					opts.shadow = Math.round(opts.shadow);
				}

				this.ctx.shadowBlur = opts.shadow;
				this.ctx.shadowColor = "black";
				this.ctx.shadowOffsetX = 6;
				this.ctx.shadowOffsetY = 6;
			}

			if (opts.round) {
				if (typeof opts.round === "boolean") {
					opts.round = 20;
				}

				if (typeof opts.round !== "number") {
					throw new Error(`Options.shadow expected integer/number. Got : ${typeof opts.round}`);
				}

				if (!Number.isInteger(opts.round)) {
					opts.round = Math.round(opts.round);
				}

				const rounded = new Buffer.from(`<svg><rect x="0" y="0" width="${image.width}" height="${image.height}" rx="${opts.round}" ry="${opts.round}"/></svg>`);
				const roundedCornerResizer = sharp(this._buffer)
					.composite([{ input: rounded, blend: "dest-in" }])
					.png();
				image = await loadImage(await roundedCornerResizer.toBuffer());
			}

			this.ctx.drawImage(image, this.canvas.width / 3 - (image.width * 1.3) / 3 + 38, this.canvas.height / 3.5 - (image.height * 1.3) / 3, image.width * 1.3, image.height * 1.3);
			this.ctx.closePath();
			this.ctx.restore();
			this.w = this.canvas.width / 3 - (image.width * 1.3) / 3 + 38;

			return this;
		};

		this.putText = () => {
			if (!this.canvas || !this.ctx) {
				throw new Error("Need initialization. Call .init() first.");
			}

			if (this._title.length > 21) {
				this._title = `${this._title.slice(0, 21)} . .`;
			}

			this.ctx.fillStyle = chroma("white").hex();
			this.ctx.font = "62px texgy";
			this.ctx.fillText(this._title, this.w, this.canvas.height / 2 + 190);
			this.ctx.fillStyle = chroma("grey").brighten(2).hex();
			this.ctx.font = "32px antre";
			this.ctx.fillText(this._artist, this.w, this.canvas.height / 2 + 250);

			this.ctx.font = "32px antre";
			this.ctx.fillStyle = chroma("white").hex();
			this.ctx.textAlign = "center";
			this.ctx.fillText("Spotify Cover by Void".split("").join(" "), this.canvas.width / 2, 290);

			return this;
		};

		this.putPlayback = () => {
			if (!this.canvas || !this.ctx) {
				throw new Error("Need initialization. Call .init() first.");
			}

			const centerX = this.w + 20;
			const centerY = this.canvas.height / 2 + 310;
			const radius = 10;

			this.ctx.font = "22px sans-thin";
			this.ctx.fillStyle = chroma("white").brighten(2).hex();
			this.ctx.fillText("0:04", this.w + 15, centerY + 30);
			this.ctx.fillText(this.toTime(this._timestamp), this.w + 800 + 15, centerY + 30);

			this.ctx.lineCap = "round";
			this.ctx.lineWidth = 5;
			this.ctx.beginPath();
			this.ctx.strokeStyle = chroma("white").brighten(2).hex();
			this.ctx.moveTo(centerX - 19, centerY);
			this.ctx.lineTo(centerX - 15, centerY);
			this.ctx.stroke();
			this.ctx.closePath();

			this.ctx.beginPath();
			this.ctx.strokeStyle = chroma("gray").brighten(1).hex();
			this.ctx.moveTo(centerX, centerY);
			this.ctx.lineTo(this.w + 830, centerY);
			this.ctx.stroke();
			this.ctx.closePath();

			this.ctx.beginPath();
			this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
			this.ctx.fill();
			this.ctx.closePath();

			return this;
		};

		this.putButtons = async () => {
			if (!this.canvas || !this.ctx) {
				throw new Error("Need initialization. Call .init() first.");
			}

			const contrast = this.revertBlack;
			let iconType = 1;

			if (contrast) {
				iconType = 2;
			}

			const assets = {};
			const dir = await fs.readdir("./Media Files/Assets/");

			for (const asset of dir) {
				if (asset.startsWith(iconType)) {
					assets[asset.split("_").slice(2).join("_").replace(/\..*/, "")] = await loadImage(`./Media Files/Assets/${asset}`);
				}
			}

			const w = 512 / 3.1;
			const h = 512 / 3.1;

			const n = 2.5;

			const x = (w1) => this.canvas.width / (n - 0.5) - (w1 || w) / (n - 0.5);
			const y = (h1) => this.canvas.height / (n - 0.5) - (h1 || h) / (n - 0.5) + 430;

			this.ctx.drawImage(assets.pause, x(), y(), w, h);
			this.ctx.drawImage(assets.down_arrow, x(w / (n - 0.3)) - 390, y(h / (n - 0.3)) - 1320, w / (n - 0.3), h / (n - 0.3));
			this.ctx.drawImage(assets.previous, x(w / (n + 0.5)) - 200, y(h / (n + 0.5)), w / (n + 0.5), h / (n + 0.5));
			this.ctx.drawImage(assets.next, x(w / (n + 0.5)) + 200, y(h / (n + 0.5)), w / (n + 0.5), h / (n + 0.5));
			this.ctx.drawImage(assets.heart, x(w / (n + 0.5)) - 390, y(h / (n + 0.5)), w / (n + 0.5), h / (n + 0.5));
			this.ctx.drawImage(assets.circle_diagonal, x(w / (n + 0.5)) + 390, y(h / (n + 0.5)), w / (n + 0.5), h / (n + 0.5));
			this.ctx.drawImage(assets.share, x(w / (n + 2.1)) + 390, y(h / (n + 2.1)) + 100, w / (n + 2.1), h / (n + 2.1));
			this.ctx.drawImage(assets.speaker, x(w / (n + 0.7)) - 360, y(h / (n + 0.7)) + 100, w / (n + 0.7), h / (n + 0.7));
		};
	}

	toTime(ms) {
		const minutes = Math.floor(ms / 60_000);
		const seconds = ((ms % 60_000) / 1000).toFixed(0);
		return seconds == 60 ? `${minutes + 1}:00` : `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
	}

	initCanvas() {
		registerFont("./Media Files/Fonts/Antebas-Regular.otf", { family: "antre" });
		registerFont("./Media Files/Fonts/texgyreadventor-bold.otf", { family: "texgy" });
		registerFont("./Media Files/Fonts/AtypText-Semibold.ttf", { family: "atyp" });
		registerFont("./Media Files/Fonts/SourceSansPro-ExtraLight.ttf", { family: "sans-thin" });
		this.canvas = createCanvas(1080, 2340);
		this.ctx = this.canvas.getContext("2d");
	}

	toBuffer() {
		return this.canvas.toBuffer();
	}

	async getTrackCover() {
		const data = await spotifier.searchTracks(this._track);
		if (!data.status) {
			const err = data.message;
			throw new Error(err);
		}
		const buffer = (
			await Axios.get(data.data.items[0].album.images[0].url, {
				responseType: "arraybuffer",
			})
		).data;
		this._buffer = buffer;
		this._title = data.data.items[0].name;
		this._artist = data.data.items[0].artists.map((v) => v.name).join(", ");
		this._timestamp = data.data.items[0].duration_ms;
	}

	async palettes() {
		this._colorPalettes = await color.getPalette(this._buffer);
	}
}
