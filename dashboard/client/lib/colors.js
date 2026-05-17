function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value));
}

function quantize(channel) {
	return Math.round(channel / 24) * 24;
}

function colorDistance(a, b) {
	const dr = a[0] - b[0];
	const dg = a[1] - b[1];
	const db = a[2] - b[2];

	return Math.sqrt(dr * dr + dg * dg + db * db);
}

function rgbToHsl([r, g, b]) {
	const rn = r / 255;
	const gn = g / 255;
	const bn = b / 255;
	const max = Math.max(rn, gn, bn);
	const min = Math.min(rn, gn, bn);
	const l = (max + min) / 2;

	if (max === min) {
		return [0, 0, l];
	}

	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	let h = 0;

	switch (max) {
		case rn:
			h = (gn - bn) / d + (gn < bn ? 6 : 0);
			break;
		case gn:
			h = (bn - rn) / d + 2;
			break;
		default:
			h = (rn - gn) / d + 4;
	}

	return [h * 60, s, l];
}

function score([r, g, b]) {
	const [, s, l] = rgbToHsl([r, g, b]);
	const saturation = clamp(s, 0, 1);
	const lightness = 1 - Math.abs(l * 2 - 1);

	return saturation * 0.7 + lightness * 0.3;
}

export function extractCoverPalette(img) {
	if (!img || !img.complete || img.naturalWidth === 0) {
		return null;
	}

	try {
		const canvas = document.createElement('canvas');
		const size = 48;

		canvas.width = size;
		canvas.height = size;

		const ctx = canvas.getContext('2d');

		if (!ctx) {
			return null;
		}

		ctx.drawImage(img, 0, 0, size, size);

		const { data } = ctx.getImageData(0, 0, size, size);
		const buckets = new Map();

		for (let i = 0; i < data.length; i += 4) {
			const a = data[i + 3];

			if (a < 200) {
				continue;
			}

			const r = quantize(data[i]);
			const g = quantize(data[i + 1]);
			const b = quantize(data[i + 2]);
			const key = `${r},${g},${b}`;
			const entry = buckets.get(key);

			if (entry) {
				entry.count += 1;
			} else {
				buckets.set(key, { rgb: [r, g, b], count: 1 });
			}
		}

		if (!buckets.size) {
			return null;
		}

		const candidates = Array.from(buckets.values()).sort((a, b) => b.count - a.count).slice(0, 12);
		const ranked = candidates
			.map((entry) => ({ ...entry, score: score(entry.rgb) * Math.log2(entry.count + 1) }))
			.sort((a, b) => b.score - a.score);

		const primary = ranked[0]?.rgb;

		if (!primary) {
			return null;
		}

		const secondary = ranked.find((entry) => colorDistance(entry.rgb, primary) > 80)?.rgb || primary;

		return {
			primary: `rgb(${primary[0]}, ${primary[1]}, ${primary[2]})`,
			secondary: `rgb(${secondary[0]}, ${secondary[1]}, ${secondary[2]})`
		};
	} catch {
		return null;
	}
}
