import Canvas from 'canvas';
import Wrap from 'canvas-text-wrapper';

const { createCanvas, registerFont, loadImage } = Canvas;
const { CanvasTextWrapper } = Wrap;

export class Attachment {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.PALETTES = {
			BACKGROUND: '#282A36',
			GREEN: 'rgb(88,239,126)',
			PINK: 'rgb(219,63,128)',
			PURPLE: '#BD93F9',
			RED: '#FF5555',
		};

		this.registerFonts();
		this.canvas = createCanvas(this.x, this.y);
		this.ctx = this.canvas.getContext('2d');

		this.appendText = (text, participant, groupName, x, y, opts) => {
			const defaultOpts = { textColor: 'white', groupName: 'white', participantColor: 'white', fontSize: 82, fontName: 'nina-bold', shadow: false };

			Object.assign(defaultOpts, opts);

			const { participantColor, groupNameColor, textColor, fontSize, fontName, shadow } = defaultOpts;

			if (shadow) {
				this.ctx.shadowOffsetX = 1;
				this.ctx.shadowOffsetY = 1;
				this.ctx.shadowColor = participantColor;
				this.ctx.shadowBlur = 5;
			}

			this.ctx.fillStyle = participantColor;

			CanvasTextWrapper(this.canvas, `𓆩 ${participant} 𓆪`, {
				font: `${fontSize}px ${fontName}`,
				textAlign: 'center',
				verticalAlign: 'bottom',
				paddingX: x / 3,
				paddingY: y / 2,
			});

			if (shadow) {
				this.ctx.shadowOffsetX = 1;
				this.ctx.shadowOffsetY = 1;
				this.ctx.shadowColor = textColor;
				this.ctx.shadowBlur = 5;
			}

			this.ctx.fillStyle = textColor;

			CanvasTextWrapper(this.canvas, text, {
				font: '30px abril-text-bold',
				textAlign: 'center',
				verticalAlign: 'bottom',
				paddingX: x / 5,
				paddingY: y / 2.84,
			});

			if (shadow) {
				this.ctx.shadowOffsetX = 1;
				this.ctx.shadowOffsetY = 1;
				this.ctx.shadowColor = groupNameColor;
				this.ctx.shadowBlur = 5;
			}

			this.ctx.fillStyle = groupNameColor;

			CanvasTextWrapper(this.canvas, groupName, {
				font: '42px abril-text-bold',
				textAlign: 'center',
				verticalAlign: 'bottom',
				paddingX: x / 5,
				paddingY: y / 8.7,
			});

			return this;
		};

		this.appendImage = async (image, opts) => {
			const defaultOpts = { roundedRadius: false, strokeWidth: 5, stroke: false, strokeColor: 'black' };

			Object.assign(defaultOpts, opts);

			const { roundedRadius, strokeWidth, stroke, strokeColor } = defaultOpts;
			const filename = image;

			image = await loadImage(image);

			let w, h, x, y;

			const changeDimen = (w0, h0, s0, y0) => {
				w = w0;
				h = h0;
				x = s0;
				y = y0;
			};

			if (filename == './Media Files/blank.png') {
				changeDimen(this.canvas.width / 2 - image.width / 2 + 5, this.canvas.height / 2 - image.height / 2 - 80, image.width / 1.04, image.height / 1.04);
			} else {
				changeDimen(this.canvas.width / 2 - image.width / 3 + 110, this.canvas.height / 2 - image.height / 3 + 15, image.width / 2.99, image.height / 2.99);
			}

			if (roundedRadius) {
				if (typeof roundedRadius !== 'number') {
					throw new Error(`Expected integer radius. Got: ${roundedRadius} ( ${typeof roundedRadius} )`);
				}

				this.roundImage(w, h, x, y, roundedRadius);
			}

			this.ctx.drawImage(image, w, h, x, y);

			if (stroke) {
				this.roundStroke(w, h, x, y, {
					roundedRadius,
					strokeColor,
					strokeWidth,
				});
			}

			this.ctx.restore();

			return this;
		};

		this.fillBackground = (color) => {
			this.ctx.fillStyle = color || this.PALETTES.BACKGROUND;
			this.ctx.fillRect(0, 0, this.x, this.y);

			return this;
		};

		this.toBuffer = () => {
			return this.canvas.toBuffer();
		};
	}

	registerFonts() {
		registerFont('./Media Files/Fonts/Nina-Bold.otf', { family: 'nina-bold' });
		registerFont('./Media Files/Fonts/Abril-Text-Bold.otf', { family: 'abril-text-bold' });
	}

	roundImage(x, y, width, height, radius) {
		this.ctx.save();
		this.ctx.beginPath();

		this.ctx.moveTo(x + radius, y);
		this.ctx.lineTo(x + width - radius, y);
		this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
		this.ctx.lineTo(x + width, y + height - radius);
		this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
		this.ctx.lineTo(x + radius, y + height);
		this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
		this.ctx.lineTo(x, y + radius);
		this.ctx.quadraticCurveTo(x, y, x + radius, y);

		this.ctx.closePath();
		this.ctx.clip();
	}

	roundStroke(x, y, width, height, { roundedRadius, strokeColor, strokeWidth }) {
		this.ctx.strokeStyle = strokeColor;
		this.ctx.lineWidth = strokeWidth;

		this.ctx.beginPath();

		this.ctx.moveTo(x + roundedRadius, y);
		this.ctx.lineTo(x + width - roundedRadius, y);
		this.ctx.quadraticCurveTo(x + width, y, x + width, y + roundedRadius);
		this.ctx.lineTo(x + width, y + height - roundedRadius);
		this.ctx.quadraticCurveTo(x + width, y + height, x + width - roundedRadius, y + height);
		this.ctx.lineTo(x + roundedRadius, y + height);
		this.ctx.quadraticCurveTo(x, y + height, x, y + height - roundedRadius);
		this.ctx.lineTo(x, y + roundedRadius);
		this.ctx.quadraticCurveTo(x, y, x + roundedRadius, y);

		this.ctx.stroke();
		this.ctx.closePath();
		this.ctx.clip();
	}
}
