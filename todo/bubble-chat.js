import Canvas from '@napi-rs/canvas';
import EMOJI_REGEX from 'emojibase-regex';
import fs from 'fs-extra';
import path from 'path';
import sharp from 'sharp';
import wrap from 'wordwrap';

const { createCanvas, loadImage, GlobalFonts } = Canvas;
const parseOnEmoji = (text) => text.split(new RegExp(`(${EMOJI_REGEX.source})`, 'g'));

GlobalFonts.registerFromPath(path.join(process.cwd(), 'src/media/fonts/JetBrainsMono-Light.ttf'), 'JetBrainsMono');
GlobalFonts.registerFromPath(path.join(process.cwd(), 'src/media/fonts/AppleColorEmoji.ttf'), 'Apple Color Emoji');

const defaultPicture = path.join(process.cwd(), 'src/media/blank.png');

class BubbleChat {
	constructor() {
		this.username = 'Unknown';
		this.profilePicture = defaultPicture;
		this.type;
		this.body;
		this.media;
		this.timestamp = Date.now();

		this.ctx;
		this.canvas;
		this.tempCtx;
		this.tempCanvas;

		this.longestText;
		this.completeTexts;
	}

	init() {
		return {
			build: () => this.build(),
			setBody: (...args) => this.setBody(...args),
			setMedia: (...args) => this.setMedia(...args),
			setTimestamp: (...args) => this.setTimestamp(...args),
			setUsername: (...args) => this.setUsername(...args),
			setProfilePicture: (...args) => this.setProfilePicture(...args),
			setType: (...args) => this.setType(...args)
		};
	}

	async build() {
		await this.#createCanvas();
		await this.#fillCaption();
		this.#putTimestamp();
		const { x, y } = await this.#fillBubble();
		await this.#drawProfile({ x, y });
	}

	setType(type) {
		this.type = type;

		return this;
	}

	setBody(body) {
		this.body = body;

		return this;
	}

	setMedia(media) {
		this.media = media;

		return this;
	}

	setTimestamp(timestamp) {
		this.timestamp = timestamp;

		return this;
	}

	setUsername(username) {
		this.username = username;

		return this;
	}

	setProfilePicture(profilePicture) {
		this.profilePicture = profilePicture;

		return this;
	}

	/**
	 * @private
	 */
	async #fillBubble() {
		const round = 50;
		const rounded = new Buffer.from(
			`<svg><rect x="0" y="0" width="${this.canvas.width}" height="${this.canvas.height}" rx="${round}" ry="${round}"/></svg>`
		);

		const roundedCornerResizer = sharp(this.canvas.toBuffer('image/png'))
			.composite([{ input: rounded, blend: 'dest-in' }])
			.png();

		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		const image = await loadImage(await roundedCornerResizer.toBuffer());

		const scale = 0.8;

		this.canvas.height = image.height * scale + 100;

		const x = (this.canvas.width - image.width * scale) / 2;
		const y = (this.canvas.height - image.height * scale) / 2;

		this.ctx.drawImage(image, x, y, image.width * scale, image.height * scale);

		return { x, y };
	}

	/**
	 * @private
	 */
	async #fillCaption() {
		this.ctx.font = '48px JetBrainsMono';
		this.ctx.fillStyle = '#282a36';
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		let isFirst = true;

		this.ctx.fillStyle = '#ff79c6';
		this.ctx.save();

		let widthText = 0;
		let heightText = 0;
		let heightUsername = 0;
		let heightTextFooter = 0;

		for (const text of this.completeTexts.split('\n')) {
			if (isFirst) {
				const parentText = parseOnEmoji(text).filter((v) => v !== '');
				this.ctx.fillStyle = '#50fa7b';
				for (let childText of parentText) {
					childText = childText.trim();
					if (!EMOJI_REGEX.test(childText)) {
						this.ctx.font = '48px JetBrainsMono';
						const [height, width] = [this.ctx.measureText(childText).emHeightAscent, this.ctx.measureText(childText).width];
						this.ctx.fillText(
							childText,
							this.canvas.width / 2 - this.tempCtx.measureText(this.longestText).width / 2 + widthText - 60,
							height + 20
						);
						widthText += width + 16;
						heightUsername = height + 20;
						continue;
					}
					const textHeight = this.ctx.measureText(childText).emHeightAscent;
					const width = this.ctx.measureText(childText).width;
					this.ctx.font = '40px Apple Color Emoji';

					this.ctx.strokeText(
						childText,
						this.canvas.width / 2 - this.tempCtx.measureText(this.longestText).width / 2 + widthText - 60,
						textHeight + 16
					);
					widthText += width + 26;
					heightUsername = textHeight + 20;
				}

				heightText = heightUsername + 40;

				isFirst = false;
				widthText = 0;

				this.ctx.restore();

				continue;
			}

			this.ctx.font = '45px JetBrainsMono';
			const parentText = parseOnEmoji(text).filter((v) => v !== '');

			for (let childText of parentText) {
				childText = childText.trim();
				if (!EMOJI_REGEX.test(childText)) {
					this.ctx.font = '45px JetBrainsMono';
					const [height, width] = [this.ctx.measureText(childText).emHeightAscent, this.ctx.measureText(childText).width];
					this.ctx.fillText(
						childText,
						this.canvas.width / 2 - this.tempCtx.measureText(this.longestText).width / 2 + widthText - 60,
						heightText + 20
					);
					heightTextFooter = height;
					widthText += width + 16;
				} else {
					const textHeight = this.ctx.measureText(childText).emHeightAscent;
					const width = this.ctx.measureText(childText).width;
					this.ctx.font = '37px Apple Color Emoji';

					this.ctx.strokeText(
						childText,
						this.canvas.width / 2 - this.tempCtx.measureText(this.longestText).width / 2 + widthText - 60,
						heightText + 16
					);
					widthText += width + 25;
					heightTextFooter = textHeight;
				}
			}

			widthText = 0;
			heightText += heightTextFooter + 6;
		}
	}

	/**
	 * @private
	 */
	async #drawProfile({ x, y }) {
		let profilePicture;
		if (this.#isValidProfilePicture) {
			profilePicture = await loadImage(this.profilePicture);
		} else {
			profilePicture = await loadImage(defaultPicture);
		}

		const circle = new Buffer.from(
			`<svg><circle cx="${profilePicture.width / 2}" cy="${profilePicture.height / 2}" r="${profilePicture.width / 2}"/></svg>`
		);

		const circleResizer = sharp(this.profilePicture)
			.composite([{ input: circle, blend: 'dest-in' }])
			.png();

		const circleImage = await loadImage(circleResizer);

		this.ctx.drawImage(circleImage, x - 110, y, 100, 100);
	}

	/**
	 * @private
	 */
	async #createCanvas() {
		await this.#createTempCanvas();
	}

	/**
	 * @private
	 */
	#putTimestamp() {
		const time = new Date(this.timestamp).toLocaleString('en-US', {
			hour: 'numeric',
			minute: 'numeric',
			timeZone: 'Asia/Jakarta',
			hour12: false
		});
		const { width } = this.ctx.measureText(time);

		this.ctx.fillStyle = '#ffff';
		this.ctx.fillText(time, this.canvas.width - width - 25, this.canvas.height - 20);
	}

	/**
	 * @private
	 */
	async #createTempCanvas() {
		const tempCanvas = createCanvas(1080, 1);
		const tempCtx = tempCanvas.getContext('2d');

		this.tempCanvas = tempCanvas;
		this.tempCtx = tempCtx;

		if (this.type === 'text') {
			const { widthFont, fontHeight, completeTexts, longestText } = this.#calculateHeight();
			const canvas = createCanvas(widthFont + 80, fontHeight + Math.pow(Math.log(fontHeight), 2) * 4 + 100);
			const ctx = canvas.getContext('2d');

			console.log(completeTexts);
			this.canvas = canvas;
			this.ctx = ctx;
			this.completeTexts = completeTexts;
			this.longestText = longestText;

			return { canvas, ctx, completeTexts, longestText };
		} else if (['imageMessage', 'videoMessage'].includes(this.type)) {
			const media = await loadImage(this.media);

			const { height, width } = media;

			const { widthFont, fontHeight, completeTexts, longestText } = this.#calculateHeight({
				ctx: tempCtx,
				maxWidth: width / 10
			});

			const canvas = createCanvas(widthFont + 80, height + fontHeight);
			const ctx = canvas.getContext('2d');

			return { canvas, ctx, completeTexts, longestText };
		}
	}

	/**
	 * @private
	 */
	#calculateHeight({ maxWidth } = { maxWidth: 43 }) {
		const texts = wrap(maxWidth)(this.body).trim();
		const completeTexts = `${this.username}\n${texts}`;

		const longestText = completeTexts.split('\n').reduce((a, b) => (a.length > b.length ? a : b));

		this.tempCtx.font = '52px JetBrainsMono';

		const widthFont = this.tempCtx.measureText(longestText).width;

		const fontHeight = texts
			.split('\n')
			.map((v) => {
				if (v.match(EMOJI_REGEX)) {
					this.tempCtx.font = '20px Apple Color Emoji';

					const height = this.tempCtx.measureText(v).emHeightAscent + 30;
					return height;
				}
				this.tempCtx.font = '45px JetBrainsMono';
				const height = this.tempCtx.measureText(v).emHeightAscent;
				return height;
			})
			.reduce((a, b) => a + b);

		return { widthFont, fontHeight, completeTexts, longestText };
	}

	toBuffer() {
		return this.canvas.toBuffer('image/png');
	}

	/**
	 * @private
	 */
	get #isUrl() {
		return /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi.test(
			this.profilePicture
		);
	}

	/**
	 * @private
	 */
	get #isValidProfilePicture() {
		if (Buffer.isBuffer(this.profilePicture) || (typeof this.profilePicture === 'string' && this.#isUrl)) {
			return true;
		}

		return false;
	}
}

const bubble = new BubbleChat();

bubble
	.init()
	.setUsername('Nanda')
	.setBody('Hello Everyone My Name is Nanda ☺️💌🤗🔨💘. Nice to meet you all!'.repeat(10))
	.setType('text');

await bubble.build();

await fs.writeFile('./bubble-chat.png', bubble.toBuffer());
