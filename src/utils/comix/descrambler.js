const GRID_COLS = 5;
const GRID_ROWS = 5;
const NUM_TILES = GRID_COLS * GRID_ROWS;
const LCG_MULTIPLIER = 1664525;
const LCG_INCREMENT = 1013904223;

function buildOrder(seed, n) {
	const arr = Array.from({ length: n }, (_, i) => i);
	let state = seed | 0;

	for (let i = n - 1; i >= 1; i--) {
		state = (Math.imul(state, LCG_MULTIPLIER) + LCG_INCREMENT) | 0;
		const j = Number(BigInt(state >>> 0) % BigInt(i + 1));
		const tmp = arr[i];

		arr[i] = arr[j];
		arr[j] = tmp;
	}

	return arr;
}

export class Descrambler {
	static get GRID_COLS() {
		return GRID_COLS;
	}

	static get GRID_ROWS() {
		return GRID_ROWS;
	}

	static buildPermutation(seed) {
		return buildOrder(seed, NUM_TILES);
	}

	static async descramble(imageBuffer, seed) {
		const sharp = (await import('sharp')).default;
		const img = sharp(imageBuffer);
		const { width, height } = await img.metadata();
		const tileW = Math.floor(width / GRID_COLS);
		const tileH = Math.floor(height / GRID_ROWS);
		const perm = buildOrder(seed, NUM_TILES);

		const raw = await img.ensureAlpha().raw().toBuffer();
		const output = Buffer.from(raw);

		for (let srcIdx = 0; srcIdx < NUM_TILES; srcIdx++) {
			const dstIdx = perm[srcIdx];
			const srcCol = srcIdx % GRID_COLS;
			const srcRow = Math.floor(srcIdx / GRID_COLS);
			const dstCol = dstIdx % GRID_COLS;
			const dstRow = Math.floor(dstIdx / GRID_COLS);

			for (let y = 0; y < tileH; y++) {
				const srcOffset = ((srcRow * tileH + y) * width + srcCol * tileW) * 4;
				const dstOffset = ((dstRow * tileH + y) * width + dstCol * tileW) * 4;

				raw.copy(output, dstOffset, srcOffset, srcOffset + tileW * 4);
			}
		}

		return sharp(output, { raw: { width, height, channels: 4 } })
			.jpeg({ quality: 90 })
			.toBuffer();
	}

	static isScrambledUrl(url) {
		return /\/(i+)\//.test(url);
	}

	static toScrambledUrl(url) {
		return url.replace(/(\/)(i+)(\/)/g, '$1s$2$3');
	}
}
