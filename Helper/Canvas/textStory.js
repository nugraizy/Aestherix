import Canvas from "canvas";
import Wrap from "canvas-text-wrapper";
const { createCanvas, registerFont } = Canvas;
const { CanvasTextWrapper } = Wrap;

export const textStory = async (texts, color) => {
	registerFont("./Media Files/Fonts/coolvetica rg.otf", { family: "coolvetica" });
	const canvas = createCanvas(540, 1170);
	const ctx = canvas.getContext("2d");
	ctx.fillStyle = ARGBtoRGBA(color);
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = ARGBtoRGBA(4_294_967_295);
	CanvasTextWrapper(canvas, texts, { font: "28px coolvetica", textAlign: "center", verticalAlign: "middle", sizeToFill: true, paddingX: 20, paddingY: 20 });
	return new Buffer.from(canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, ""), "base64");
};

const ARGBtoRGBA = (num) => {
	num >>>= 0;
	const b = num & 0xff;
	const g = (num & 0xff00) >>> 8;
	const r = (num & 0xff0000) >>> 16;
	const a = ((num & 0xff000000) >>> 24) / 255;
	return `rgba(${[r, g, b, a].join(",")})`;
};
