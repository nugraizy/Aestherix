import Canvas, { clearAllCache } from '@napi-rs/canvas';
import chroma from 'chroma-js';
import fs from 'fs-extra';
import sharp from 'sharp';
import * as color from 'colorthief';
import path from 'path';
import { fetch } from 'undici';

import { spotifier } from '../../utils/spotifier/index.js';

const { createCanvas, GlobalFonts, loadImage } = Canvas;

GlobalFonts.registerFromPath(path.join(__dirname, 'src/media/fonts/Antebas-Regular.otf'), 'antre');
GlobalFonts.registerFromPath(path.join(__dirname, 'src/media/fonts/texgyreadventor-bold.otf'), 'texgy');
GlobalFonts.registerFromPath(path.join(__dirname, 'src/media/fonts/AtypText-Semibold.ttf'), 'atyp');
GlobalFonts.registerFromPath(path.join(__dirname, 'src/media/fonts/SourceSansPro-Regular.ttf'), 'sans-regular');
GlobalFonts.registerFromPath(path.join(__dirname, 'src/media/fonts/Galyon-Book.otf'), 'galyon');
GlobalFonts.registerFromPath(path.join(__dirname, 'src/media/fonts/Lemon-Milk-Pro-Regular.ttf'), 'lemon');
GlobalFonts.registerFromPath(path.join(__dirname, 'src/media/fonts/SFUIDisplay-Medium.otf'), 'sf-pro');
GlobalFonts.registerFromPath(path.join(__dirname, 'src/media/fonts/Roboto-Medium.ttf'), 'roboto-medium');

const assets = {
	model: null
};

const instagramUsername = 'dizy.env';
const githubUsername = 'nugraizy';
const watermark = 'Spotify Card by Void';

export class SpotifyCard {
	/**
	 * @private
	 */
	#_opts;

	/**
	 * @private
	 */
	#_track;

	/**
	 * @private
	 */
	#_title;

	/**
	 * @private
	 */
	#_artist;

	/**
	 * @private
	 */
	#_timestamp;

	/**
	 * @private
	 */
	#_buffer;

	/**
	 * @private
	 */
	#_colorPalettes;

	/**
	 * @private
	 */
	#_loadedCover;

	/**
	 * @private
	 */
	#_revertBlack;

	/**
	 * @private
	 */
	#_w;

	/**
	 * @private
	 */
	#_isRendered;

	/**
	 * @private
	 */
	#_canvas;

	/**
	 * @private
	 */
	#_ctx;

	/**
	 * @private
	 */
	#_toBuffer;

	/**
	 * Creates an instance of SpotifyCard.
	 * @param {string} track
	 * @param {{background?: { blur?: number | boolean, color?: string, gradient?: string }, cover?: { shadow?: number | boolean, round?: number | boolean }}} param1
	 */
	constructor(track, { background, cover }) {
		if (!track) {
			const err = 'Track name is required.';

			throw new Error(err);
		}

		this.#_opts = {
			background: {
				blur: background?.blur || false,
				color: background?.color || false,
				gradient: background?.gradient || false
			},
			cover: {
				shadow: cover?.shadow || false,
				round: cover?.round || false
			}
		};

		/**
		 * @private
		 */
		this.#_track = track;

		/**
		 * @private
		 */
		this.#_title = null;

		/**
		 * @private
		 */
		this.#_artist = null;

		/**
		 * @private
		 */
		this.#_timestamp = null;

		/**
		 * @private
		 */
		this.#_buffer = null;

		/**
		 * @private
		 */
		this.#_colorPalettes = null;

		/**
		 * @private
		 */
		this.#_loadedCover = null;

		/**
		 * @private
		 */
		this.#_revertBlack = false;

		/**
		 * @private
		 */
		this.#_w = null;

		/**
		 * @private
		 */
		this.#_isRendered = false;

		/**
		 * @type {Canvas.Canvas}
		 * @private
		 */
		this.#_canvas = createCanvas(1080, 2340);

		/**
		 * @type {Canvas.SKRSContext2D}
		 * @private
		 */
		this.#_ctx = this.#_canvas.getContext('2d');

		/**
		 * Render Spotify Card
		 * @returns {Promise<{message?: string, toBuffer: () => Buffer}>}
		 */
		this.render = async () => {
			if (this.#_isRendered) {
				const err = 'SpotifyCover is already rendered.';

				return { message: err, toBuffer: this.#_toBuffer };
			}

			await this.getTrackCover();
			await this.palettes();
			await this.fillBackground(this.#_opts.background);
			await this.putTrackCover(this.#_opts.cover);
			await this.putButtons();
			await this.putStatusBar();
			await this.putNavigator();
			this.putText();
			this.putPlayback();

			return { toBuffer: this.#_toBuffer };
		};

		this.#_toBuffer = () => {
			clearAllCache();
			return this.#_canvas.toBuffer('image/png');
		};
	}

	/**
	 * @private
	 */
	async fillBackground(opts) {
		if (typeof opts !== 'object' && opts) {
			const err = `Expected opts to be Object. Got : ${typeof opts}`;

			throw new Error(err);
		}

		if (!opts) {
			opts = {};
		}

		if (!opts.gradient) {
			opts.gradient = false;
		}

		if (!opts.color) {
			opts.color = this.#_colorPalettes[0];
		}

		if (!opts.blur) {
			opts.blur = false;
		}

		if (opts.gradient) {
			let gradient;
			const gradientNumber = Math.floor(Math.random() * 3);

			gradient = this.#_ctx.createLinearGradient(
				0,
				this.#_canvas.height - 300,
				this.#_canvas.width / 1.4,
				this.#_canvas.height
			);

			gradient.addColorStop(0, chroma(this.#_colorPalettes[gradientNumber]).darken(0.7).hex());
			gradient.addColorStop(1, chroma(this.#_colorPalettes[gradientNumber]).darken(2).hex());

			this.#_revertBlack = chroma(this.#_colorPalettes[gradientNumber]).name() === 'white';

			this.#_ctx.fillStyle = gradient;

			this.#_ctx.fillRect(0, 0, this.#_canvas.width, this.#_canvas.height);
		} else if (opts.blur) {
			if (!this.#_loadedCover) {
				this.#_loadedCover = await loadImage(this.#_buffer);
			}

			opts.blur = typeof opts.blur === 'boolean' ? 50 : opts.blur;

			const cover = this.#_loadedCover;

			const scale = Math.max(this.#_canvas.width / cover.width, this.#_canvas.height / cover.height);

			const scaledWidth = cover.width * scale;
			const scaledHeight = cover.height * scale;

			const offsetX = (this.#_canvas.width - scaledWidth) / 2;
			const offsetY = -60;

			this.#_ctx.save();
			this.#_ctx.filter = `blur(${opts.blur}px) brightness(0.8)`;

			this.#_ctx.drawImage(cover, offsetX, offsetY, scaledWidth, scaledHeight + 110);

			this.#_ctx.restore();
		} else if (opts.color) {
			this.#_ctx.fillStyle = chroma.valid(opts.color) ? opts.color : chroma(this.#_colorPalettes[0]).darken(0.7);

			this.#_ctx.fillRect(0, 0, this.#_canvas.width, this.#_canvas.height);
		}

		return this;
	}

	/**
	 * @private
	 */
	async putTrackCover(opts) {
		if (!opts) {
			opts = {};
		}

		if (!opts.shadow) {
			opts.shadow = false;
		}

		if (!opts.round) {
			opts.round = false;
		}

		if (!this.#_loadedCover) {
			this.#_loadedCover = await loadImage(this.#_buffer);
		}

		this.#_ctx.save();
		this.#_ctx.beginPath();

		if (opts.shadow) {
			if (typeof opts.shadow === 'boolean') {
				opts.shadow = 10;
			}

			if (typeof opts.shadow !== 'number') {
				const err = `Options.shadow expected integer/number. Got : ${typeof opts.shadow}`;

				throw new Error(err);
			}

			if (!Number.isInteger(opts.shadow)) {
				opts.shadow = Math.round(opts.shadow);
			}

			this.#_ctx.shadowBlur = opts.shadow;
			this.#_ctx.shadowColor = '#333333';
			this.#_ctx.shadowOffsetX = 6;
			this.#_ctx.shadowOffsetY = 6;
		}

		let image = this.#_loadedCover;

		if (opts.round) {
			if (typeof opts.round === 'boolean') {
				opts.round = 20;
			}

			if (typeof opts.round !== 'number') {
				const err = `Options.round expected integer/number. Got : ${typeof opts.round}`;

				throw new Error(err);
			}

			if (!Number.isInteger(opts.round)) {
				opts.round = Math.round(opts.round);
			}

			const process = new Buffer.from(
				`<svg><rect x="0" y="0" width="${this.#_loadedCover.width}" height="${this.#_loadedCover.height}" rx="${
					opts.round
				}" ry="${opts.round}"/></svg>`
			);
			const sharpInstance = sharp(this.#_buffer)
				.composite([{ input: process, blend: 'dest-in' }])
				.png();

			const buffer = await sharpInstance.toBuffer();

			image = await loadImage(buffer);
		}

		const scaleFactor = 1.3;

		const scaledWidth = image.width * scaleFactor;
		const scaledHeight = image.height * scaleFactor;

		const centerX = this.#_canvas.width / 3;
		const centerY = this.#_canvas.height / 3.5;

		this.#_ctx.drawImage(image, centerX - scaledWidth / 3 + 38, centerY - scaledHeight / 3, scaledWidth, scaledHeight);

		this.#_ctx.closePath();
		this.#_ctx.restore();
		this.#_w = this.#_canvas.width / 3 - (image.width * 1.3) / 3 + 38;

		return this;
	}

	/**
	 * @private
	 */
	putText() {
		if (this.#_title.length > 22) {
			this.#_title = `${this.#_title.slice(0, 22)}`;
		}

		this.#_ctx.font = '62px texgy';

		const fadeOut = this.#_ctx.createLinearGradient(0, 0, this.#_w + 1500, 0);

		fadeOut.addColorStop(0, 'rgba(255, 255, 255, 1)');
		fadeOut.addColorStop(1, 'rgba(255, 255, 255, 0)');

		this.#_ctx.fillStyle = fadeOut;
		this.#_ctx.fillText(this.#_title, this.#_w - 10, this.#_canvas.height / 2 + 190);

		this.#_ctx.font = '32px antre';

		this.#_ctx.fillStyle = chroma('grey').brighten(2).hex();
		this.#_ctx.fillText(this.#_artist, this.#_w - 10, this.#_canvas.height / 2 + 250);

		this.#_ctx.font = 'bold 32px lemon';
		this.#_ctx.textAlign = 'center';

		this.#_ctx.save();
		this.#_ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
		this.#_ctx.fill;
		this.#_ctx.fillText(watermark.split('').join(' '), this.#_canvas.width / 2, 290);
		this.#_ctx.restore();

		return this;
	}

	/**
	 * @private
	 */
	putPlayback() {
		const centerX = this.#_w + 20;
		const centerY = this.#_canvas.height / 2 + 310;
		const radius = 10;

		this.#_ctx.font = '30px sans-regular';

		this.#_ctx.fillStyle = chroma('white').brighten(2).hex();

		this.#_ctx.fillText('0:04', this.#_w + 15, centerY + 50);
		this.#_ctx.fillText(this.toTime(this.#_timestamp), this.#_w + 800 + 15, centerY + 50);

		this.#_ctx.lineCap = 'round';
		this.#_ctx.lineWidth = 10;

		this.#_ctx.beginPath();
		this.#_ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
		this.#_ctx.moveTo(centerX - 25, centerY);
		this.#_ctx.lineTo(centerX - 15, centerY);
		this.#_ctx.stroke();

		this.#_ctx.moveTo(centerX + radius, centerY);
		this.#_ctx.lineTo(this.#_w + 830, centerY);
		this.#_ctx.stroke();

		this.#_ctx.fillStyle = 'white';
		this.#_ctx.arc(centerX + 6, centerY, radius, 0, 2 * Math.PI, false);
		this.#_ctx.fill();
		this.#_ctx.closePath();

		return this;
	}

	async putNavigator() {
		this.#_ctx.beginPath();
		this.#_ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
		this.#_ctx.lineCap = 'round';
		this.#_ctx.lineWidth = 12;
		this.#_ctx.moveTo(320, this.#_canvas.height - 30);
		this.#_ctx.lineTo(this.#_canvas.width - 320, this.#_canvas.height - 30);
		this.#_ctx.stroke();
		this.#_ctx.closePath();

		return this;
	}

	async putStatusBar() {
		let iconType = 1;
		const contrast = this.#_revertBlack;

		if (contrast) {
			iconType = 2;
		}

		this.#_ctx.drawImage(
			assets.model[`${iconType}_bar_ios_17`],
			this.#_canvas.width / 2 - assets.model[`${iconType}_bar_ios_17`].width / 2,
			30,
			assets.model[`${iconType}_bar_ios_17`].width,
			assets.model[`${iconType}_bar_ios_17`].height
		);

		this.#_ctx.beginPath();
		this.#_ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
		this.#_ctx.lineCap = 'round';
		this.#_ctx.lineWidth = 8;
		this.#_ctx.moveTo(
			this.#_canvas.width - assets.model[`${iconType}_bar_ios_17`].height - 190,
			assets.model[`${iconType}_bar_ios_17`].height + 60
		);
		this.#_ctx.lineTo(
			this.#_canvas.width - assets.model[`${iconType}_bar_ios_17`].height - 50,
			assets.model[`${iconType}_bar_ios_17`].height + 60
		);
		this.#_ctx.stroke();
		this.#_ctx.closePath();

		const clock = new Date().toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: 'numeric',
			hour12: false
		});

		this.#_ctx.font = assets.model[`${iconType}_bar_ios_17`].height + 'px roboto-medium';
		this.#_ctx.fillStyle = iconType === 1 ? 'white' : '#333333';

		this.#_ctx.fillText(
			clock,
			this.#_canvas.width / 2 - assets.model[`${iconType}_bar_ios_17`].width / 2 + 10,
			assets.model[`${iconType}_bar_ios_17`].height + 28
		);

		return this;
	}

	/**
	 * @private
	 */
	async putButtons() {
		let iconType = 1;
		const contrast = this.#_revertBlack;

		if (contrast) {
			iconType = 2;
		}

		if (!assets.model) {
			assets.model = {};
			const dir = await fs.readdir('./src/media/assets/');

			for (const asset of dir) {
				assets.model[`${asset.at(0)}_${asset.split('_').slice(2).join('_').replace(/\..*/, '')}`] = await loadImage(
					`./src/media/assets/${asset}`
				);
			}
		}

		const w = 512 / 3.1;
		const h = 512 / 3.1;

		const n = 2.5;

		const x = (w1) => this.#_canvas.width / (n - 0.5) - (w1 || w) / (n - 0.5);
		const y = (h1) => this.#_canvas.height / (n - 0.5) - (h1 || h) / (n - 0.5) + 430;

		this.#_ctx.drawImage(assets.model[`${iconType}_pause`], x(), y() + 40, w, h);

		// this.#_ctx.drawImage(
		// 	assets.model[`${iconType}_down_arrow`],
		// 	x(w / (n - 0.3)) - 390,
		// 	y(h / (n - 0.3)) - 1320,
		// 	w / (n - 0.3),
		// 	h / (n - 0.3)
		// );
		this.#_ctx.drawImage(
			assets.model[`${iconType}_previous`],
			x(w / (n + 0.5)) - 200,
			y(h / (n + 0.5)) + 40,
			w / (n + 0.5),
			h / (n + 0.5)
		);
		this.#_ctx.drawImage(
			assets.model[`${iconType}_next`],
			x(w / (n + 0.5)) + 200,
			y(h / (n + 0.5)) + 40,
			w / (n + 0.5),
			h / (n + 0.5)
		);
		this.#_ctx.drawImage(
			assets.model[`${iconType}_heart`],
			x(w / (n + 0.5)) - 390,
			y(h / (n + 0.5)),
			w / (n + 0.5),
			h / (n + 0.5)
		);
		this.#_ctx.drawImage(
			assets.model[`${iconType}_circle_diagonal`],
			x(w / (n + 0.5)) + 390,
			y(h / (n + 0.5)),
			w / (n + 0.5),
			h / (n + 0.5)
		);
		this.#_ctx.drawImage(
			assets.model[`${iconType}_share`],
			x(w / (n + 2.1)) + 390,
			y(h / (n + 2.1)) + 100,
			w / (n + 2.1),
			h / (n + 2.1)
		);
		this.#_ctx.drawImage(
			assets.model[`${iconType}_speaker`],
			x(w / (n + 0.7)) - 390,
			y(h / (n + 0.7)) + 100,
			w / (n + 0.7),
			h / (n + 0.7)
		);

		this.#_ctx.drawImage(
			assets.model[`${iconType}_github`],
			120,
			this.#_canvas.height - 220,
			assets.model[`${iconType}_github`].width / 2,
			assets.model[`${iconType}_github`].height / 2
		);
		this.#_ctx.drawImage(
			assets.model['1_spotify_likes'],
			x(w / (n + 0.5)) + 390,
			y(h / (n + 0.5)) - 180,
			w / (n + 0.5),
			h / (n + 0.5)
		);
		this.#_ctx.font = '32px galyon';
		this.#_ctx.fillStyle = 'white';
		this.#_ctx.fillText(githubUsername, 220, this.#_canvas.height - 180);

		this.#_ctx.drawImage(
			assets.model[`${iconType}_instagram`],
			this.#_canvas.width - 120 - assets.model[`${iconType}_instagram`].width / 8.5,
			this.#_canvas.height - 220,
			assets.model[`${iconType}_instagram`].width / 8.5,
			assets.model[`${iconType}_instagram`].height / 8.5
		);
		this.#_ctx.font = '32px galyon';
		this.#_ctx.fillStyle = 'white';
		this.#_ctx.fillText(
			instagramUsername,
			this.#_canvas.width -
				160 -
				this.#_ctx.measureText(instagramUsername).width -
				assets.model[`${iconType}_instagram`].height / 8.5,
			this.#_canvas.height - 180
		);

		return this;
	}

	/**
	 * @private
	 */
	toTime(ms) {
		const minutes = Math.floor(ms / 60_000);
		const seconds = Math.floor((ms % 60_000) / 1000);

		return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
	}

	/**
	 * @private
	 */
	async getTrackCover() {
		const data = await spotifier.searchTracks(this.#_track);

		if (!data.status) {
			const err = data.message;

			throw new Error(err);
		}

		const req = await fetch(data.data.items[0].album.images[0].url);
		const buffer = Buffer.from(await req.arrayBuffer());

		this.#_buffer = buffer;
		this.#_title = data.data.items[0].name;
		this.#_artist = data.data.items[0].artists.map((v) => v.name).join(', ');
		this.#_timestamp = data.data.items[0].duration_ms;
	}

	/**
	 * @private
	 */
	async palettes() {
		this.#_colorPalettes = await color.getPalette(this.#_buffer);
	}
}
