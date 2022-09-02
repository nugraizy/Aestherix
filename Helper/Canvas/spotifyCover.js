import Canvas from "canvas";
import chroma from "chroma-js";
import * as FT from "file-type";
import fs from "fs-extra";
import color from "get-image-colors";
import fetch from "node-fetch";
import { spotifier } from "../../Utils/Spotifier/Spotify.js";

const { createCanvas, registerFont, loadImage } = Canvas;
const shuffleArray = (array = []) => {
	let curId = array.length;
	while (0 !== curId) {
		const randId = Math.floor(Math.random() * curId);
		curId--;
		const tmp = array[curId];
		array[curId] = array[randId];
		array[randId] = tmp;
	}
	return array;
};

export class SpotifyCover {
	constructor() {
		this._track = null;
		this._title = null;
		this._artist = null;
		this._timestamp = null;
		this._buffer = null;
		this._mime = null;
		this._colorPalettes = null;
		this.revertBlack = false;
		this._tracklist = [];
		this.canvas = null;
		this.ctx = null;
		this.w = null;

		this.init = async (track) => {
			if (this.canvas || this.ctx) {
				throw new Error("Spotify Cover already been initialized.");
			}

			this._track = track;

			await this.getTrackCover();
			await this.mime();
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

			if (opts.gradient) {
				gradient = this.ctx.createLinearGradient(0, this.canvas.height - 300, this.canvas.width / 1.4, this.canvas.height);

				gradient.addColorStop(0, chroma(this._colorPalettes[0]).darken(0.7).hex());
				gradient.addColorStop(1, chroma(this._colorPalettes[0]).darken(2).hex());
			}

			this.revertBlack = chroma(this._colorPalettes[0]).name() == "black";

			this.ctx.fillStyle = opts.gradient ? gradient : opts.color ? (chroma.valid(opts.color) ? opts.color : chroma(this._colorPalettes[0]).darken(0.7)) : this._colorPalettes[0];
			this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

			return this;
		};

		this.putTrackCover = async () => {
			if (!this.canvas || !this.ctx) {
				throw new Error("Need initialization. Call .init() first.");
			}

			const image = await loadImage(this._buffer);

			this.ctx.drawImage(image, this.canvas.width / 3 - (image.width * 1.3) / 3 + 38, this.canvas.height / 3.5 - (image.height * 1.3) / 3, image.width * 1.3, image.height * 1.3);
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
			this.ctx.font = "42px antre";
			this.ctx.fillText(this._artist, this.w, this.canvas.height / 2 + 250);

			return this;
		};

		this.putPlayback = () => {
			const centerX = this.w + 20;
			const centerY = this.canvas.height / 2 + 460;
			const radius = 10;

			this.ctx.font = "22px sans-thin";
			this.ctx.fillStyle = chroma("white").brighten(2).hex();
			this.ctx.fillText("0:04", this.w, this.canvas.height / 2 + 500);
			this.ctx.fillText(this.toTime(this._timestamp), this.w + 800, this.canvas.height / 2 + 500);

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
			this.ctx.lineTo(this.w + 820, centerY);
			this.ctx.stroke();
			this.ctx.closePath();

			this.ctx.beginPath();
			this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
			this.ctx.fill();
			this.ctx.closePath();

			return this;
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
		this._buffer = new Buffer.from(await (await fetch(data.data.items[0].album.images[0].url)).arrayBuffer(), "base64");
		this._title = data.data.items[0].name;
		this._artist = data.data.items[0].artists.map((v) => v.name).join(", ");
		this._timestamp = data.data.items[0].duration_ms;
		delete data.data.items[0];
		this._tracklist = data.data.items;
	}

	async mime() {
		try {
			const { mime } = await FT.fileTypeFromBuffer(this._buffer);
			this._mime = mime;
		} catch (err) {
			throw new Error(err);
		}
	}

	async palettes() {
		this._colorPalettes = shuffleArray((await color(new Buffer.from(this._buffer, "base64"), this._mime)).map((v) => `rgba(${v._rgb._unclipped.join(", ")})`));
	}
}
