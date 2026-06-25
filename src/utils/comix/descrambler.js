const GRID_COLS = 5;
const GRID_ROWS = 5;
const NUM_TILES = GRID_COLS * GRID_ROWS;

const ENC_MULTIPLIER = 1000005;
const ENC_INCREMENT = 1234567891;
const LCG_MULTIPLIER = 1664525;
const LCG_INCREMENT = 1013904223;

const SCRAMBLE_HASH_MAP = {
	'03632': 58414
};

function buildOrderLcg(seed, n) {
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

function nextXorshiftState(state) {
	let next = state;

	next ^= (next << 13) >>> 0;
	next ^= (next >>> 17);
	next ^= (next << 5) >>> 0;
	return next >>> 0;
}

function buildOrderXorshift(seed, n) {
	const arr = Array.from({ length: n }, (_, i) => i);
	let state = (seed | 0) || 1;

	for (let i = n - 1; i >= 1; i--) {
		state = nextXorshiftState(state);
		const j = Number(BigInt(state) % BigInt(i + 1));
		const tmp = arr[i];

		arr[i] = arr[j];
		arr[j] = tmp;
	}

	return arr;
}

function buildInverse(order) {
	const inverse = new Array(order.length);

	for (let i = 0; i < order.length; i++) {
		inverse[order[i]] = i;
	}

	return inverse;
}

function decodeWithLcg(bytes, seed, length) {
	const result = Buffer.from(bytes);
	let state = seed | 0;

	const limit = Math.min(result.length, length);

	for (let i = 0; i < limit; i++) {
		state = (Math.imul(state, ENC_MULTIPLIER) + ENC_INCREMENT) | 0;
		result[i] ^= (state >>> 24) & 0xFF;
	}

	return result;
}

function decodeWithXorshift(bytes, seed, length, highByte) {
	const result = Buffer.from(bytes);
	let state = seed | 0;

	const limit = Math.min(result.length, length);

	for (let i = 0; i < limit; i++) {
		state = nextXorshiftState(state);

		const key = highByte ? (state >>> 24) & 0xFF : state & 0xFF;

		result[i] ^= key;
	}

	return result;
}

function hasImageSignature(bytes) {
	if (bytes.length < 12) {
		return false;
	}

	const isWebP = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
		&& bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;

	const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8;

	const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;

	return isWebP || isJpeg || isPng;
}

function decodeEncodedBytes(bytes, seed, length, algo) {
	if (algo !== '2') {
		return decodeWithLcg(bytes, seed, length);
	}

	const candidates = [
		decodeWithXorshift(bytes, seed | 1, length, false),
		decodeWithXorshift(bytes, seed, length, false),
		decodeWithXorshift(bytes, seed | 1, length, true),
		decodeWithLcg(bytes, seed, length)
	];

	return candidates.find((c) => hasImageSignature(c)) || candidates[0];
}

function decodeScrambleHash(hash) {
	return SCRAMBLE_HASH_MAP[hash?.trim()] || 0;
}

export class Descrambler {
	static get GRID_COLS() {
		return GRID_COLS;
	}

	static get GRID_ROWS() {
		return GRID_ROWS;
	}

	static buildPermutation(seed) {
		return buildOrderLcg(seed, NUM_TILES);
	}

	static descramble(imageBuffer, seed) {
		return Descrambler.descrambleGrid(imageBuffer, seed, '1');
	}

	static async descrambleGrid(imageBuffer, seed, algo) {
		const sharp = (await import('sharp')).default;
		const img = sharp(imageBuffer);
		const { width, height } = await img.metadata();

		const tileW = Math.floor(width / GRID_COLS);
		const tileH = Math.floor(height / GRID_ROWS);

		const order = algo === '3' ? buildOrderXorshift(seed, NUM_TILES) : buildOrderLcg(seed, NUM_TILES);

		const perm = buildInverse(order);

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

	static async processPage(imageBuffer, headers) {
		const rawScrambleSeed = headers['x-scramble-seed'];
		const rawScrambleGrid = headers['x-scramble-grid'];
		const rawScrambleAlgo = headers['x-scramble-algo'];
		const rawScrambleHash = headers['x-scramble-hash'];
		const rawEncSeed = headers['x-enc-seed'];
		const rawEncAlgo = headers['x-enc-algo'];
		const rawEncLen = headers['x-enc-len'];

		const encSeed = rawEncSeed ? parseInt(rawEncSeed, 10) : null;
		const encLen = rawEncLen ? parseInt(rawEncLen, 10) : null;
		const scrambleSeed = rawScrambleSeed ? parseInt(rawScrambleSeed, 10) : null;
		const scrambleHash = decodeScrambleHash(rawScrambleHash);

		const needsXor = encSeed != null && encSeed !== 0 && encLen != null;

		const shouldDescrambleGrid = rawScrambleGrid === '5x5'
			&& (!rawScrambleAlgo || rawScrambleAlgo === '1' || rawScrambleAlgo === '2' || rawScrambleAlgo === '3')
			&& scrambleSeed != null && scrambleSeed !== 0;

		if (!needsXor && !shouldDescrambleGrid) {
			return imageBuffer;
		}

		let bytes = imageBuffer;

		if (needsXor) {
			bytes = decodeEncodedBytes(bytes, encSeed, encLen, rawEncAlgo);
		}

		if (shouldDescrambleGrid) {
			const effectiveSeed = scrambleSeed ^ scrambleHash;

			bytes = await Descrambler.descrambleGrid(bytes, effectiveSeed, rawScrambleAlgo || '1');
		}

		return bytes;
	}

	static isScrambledUrl(url) {
		return /\/(i+)\//.test(url);
	}

	static toScrambledUrl(url) {
		return url.replace(/(\/)(i+)(\/)/g, '$1s$2$3');
	}
}
