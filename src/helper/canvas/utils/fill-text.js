/**
 * Fast canvas text wrapper with binary search for sizeToFill.
 * Drop-in replacement for CanvasTextWrapper with the options used in this project:
 *   { font, textAlign: 'center', verticalAlign: 'middle', sizeToFill: true }
 */
export function fillText(canvas, text, options = {}) {
	const ctx = canvas.getContext('2d');
	const width = canvas.width;
	const height = canvas.height;
	const fontFamily = options.font?.replace(/\d+px\s*/, '') || 'sans-serif';

	const fontSize = findMaxFontSize(ctx, text, width, height, fontFamily);

	ctx.font = `${fontSize}px ${fontFamily}`;

	const lineHeight = fontSize * 1.1;
	const lines = wrapLines(ctx, text, width);
	const totalHeight = lines.length * lineHeight;

	let y;

	if (options.verticalAlign === 'middle') {
		y = (height - totalHeight) / 2 + fontSize * 0.85;
	} else {
		y = fontSize;
	}

	ctx.textAlign = options.textAlign || 'left';

	const x = options.textAlign === 'center' ? width / 2 : 0;

	for (const line of lines) {
		ctx.fillText(line, x, y);
		y += lineHeight;
	}
}

function findMaxFontSize(ctx, text, maxWidth, maxHeight, fontFamily) {
	let lo = 1;
	let hi = maxHeight;

	while (lo < hi) {
		const mid = (lo + hi + 1) >> 1;

		ctx.font = `${mid}px ${fontFamily}`;

		const lines = wrapLines(ctx, text, maxWidth);
		const totalHeight = lines.length * mid * 1.1;

		if (totalHeight <= maxHeight && lines.every((l) => ctx.measureText(l).width <= maxWidth)) {
			lo = mid;
		} else {
			hi = mid - 1;
		}
	}

	return lo;
}

function wrapLines(ctx, text, maxWidth) {
	const words = text.split(/\s+/);

	if (words.length === 0) {
		return [''];
	}

	const lines = [];
	let current = words[0];

	for (let i = 1; i < words.length; i++) {
		const test = current + ' ' + words[i];

		if (ctx.measureText(test).width <= maxWidth) {
			current = test;
		} else {
			lines.push(current);
			current = words[i];
		}
	}

	lines.push(current);

	return lines;
}
