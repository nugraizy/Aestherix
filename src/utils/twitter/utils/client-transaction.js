import crypto from 'node:crypto';
import { fetch } from 'undici';

const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const floatToHex = (numf) => {
	const numi = Math.floor(numf);
	let fraction = numf - numi;

	if (!fraction) {
		return numi.toString(16);
	}

	const result = ['.'];

	while (fraction > 0.0) {
		fraction *= 16.0;
		const integer = Math.floor(fraction);

		fraction -= integer;
		result.push(integer > 9 ? String.fromCharCode(integer + 87) : String(integer));
	}

	return numi.toString(16) + result.join('');
};

const isOdd = (num) => (num % 2 ? -1.0 : 0.0);

const roundJs = (num) => {
	const floor = Math.floor(num);

	return num - floor < 0.5 ? floor : Math.ceil(num);
};

const scale = (value, valueMin, valueMax, rounding) => {
	const result = value * ((valueMax - valueMin) / 255.0) + valueMin;

	return rounding ? Math.floor(result) : Math.round(result * 100) / 100;
};

const cubicCalculate = (a, b, m) => {
	const m1 = 1.0 - m;

	return 3.0 * a * m1 * m1 * m + 3.0 * b * m1 * m * m + m * m * m;
};

const cubicValue = (curve, t) => {
	if (t <= 0.0) {
		let value;

		if (curve[0] > 0.0) {
			value = curve[1] / curve[0];
		} else if (curve[1] === 0.0 && curve[2] > 0.0) {
			value = curve[3] / curve[2];
		} else {
			value = 0.0;
		}

		return value * t;
	}

	if (t >= 1.0) {
		let value;

		if (curve[2] < 1.0) {
			value = (curve[3] - 1.0) / (curve[2] - 1.0);
		} else if (curve[2] === 1.0 && curve[0] < 1.0) {
			value = (curve[1] - 1.0) / (curve[0] - 1.0);
		} else {
			value = 0.0;
		}

		return 1.0 + value * (t - 1.0);
	}

	let start = 0.0;
	let end = 1.0;

	while (start < end) {
		const mid = (start + end) / 2.0;
		const est = cubicCalculate(curve[0], curve[2], mid);

		if (Math.abs(t - est) < 0.00001) {
			return cubicCalculate(curve[1], curve[3], mid);
		}

		if (est < t) {
			start = mid;
		} else {
			end = mid;
		}
	}

	return cubicCalculate(curve[1], curve[3], (start + end) / 2.0);
};

const interpolateValue = (x, a, b) => {
	if (typeof a === 'boolean') {
		return x <= 0.5 ? a : b;
	}

	return a * (1.0 - x) + b * x;
};

const interpolateList = (x, a, b) => a.map((_, i) => interpolateValue(x, a[i], b[i]));

const rotationMatrix2d = (deg) => {
	const rad = (deg * Math.PI) / 180;
	const cos = Math.cos(rad);
	const sin = Math.sin(rad);

	return [cos, -sin, sin, cos];
};

let instance = null;
let initPromise = null;

class ClientTransaction {
	constructor() {
		this.keyBytes = null;
		this.animationKey = null;
	}

	async initialize() {
		const response = await fetch('https://x.com/', {
			headers: { 'User-Agent': USER_AGENT }
		});
		const homepage = await response.text();

		const key = this._extractVerificationKey(homepage);

		if (!key) {
			throw new Error("Failed to extract 'twitter-site-verification' key"); /* eslint-disable-line */
		}

		const ondemandPos = homepage.indexOf('"ondemand.s"');

		if (ondemandPos < 0) {
			throw new Error('Failed to find ondemand.s reference');
		}

		const ondemandKey = this._rextr(homepage, ',', ':', ondemandPos);

		if (!ondemandKey) {
			throw new Error('Failed to extract ondemand key');
		}

		const ondemandS = this._extr(homepage, ondemandKey + ':"', '"', ondemandPos);

		if (!ondemandS) {
			throw new Error('Failed to extract ondemand s value');
		}

		const indices = await this._extractIndices(ondemandS);

		if (!indices.length) {
			throw new Error('Failed to extract KEY_BYTE indices');
		}

		const frames = this._extractFrames(homepage);

		if (!frames.length) {
			throw new Error('Failed to extract animation frame data');
		}

		this.keyBytes = Buffer.from(key, 'base64');
		this.animationKey = this._calculateAnimationKey(frames, indices[0], this.keyBytes, indices.slice(1));
	}

	_extr(text, begin, end, pos = 0) {
		const beginPos = text.indexOf(begin, pos);

		if (beginPos < 0) {
			return '';
		}

		const contentStart = beginPos + begin.length;
		const endPos = text.indexOf(end, contentStart);

		if (endPos < 0) {
			return '';
		}

		return text.substring(contentStart, endPos);
	}

	_rextr(text, begin, end, pos) {
		const beginPos = text.lastIndexOf(begin, pos - 1);

		if (beginPos < 0) {
			return '';
		}

		const contentStart = beginPos + begin.length;
		const endPos = text.indexOf(end, contentStart);

		if (endPos < 0) {
			return '';
		}

		return text.substring(contentStart, endPos);
	}

	_extractVerificationKey(homepage) {
		const pos = homepage.indexOf('name="twitter-site-verification"');

		if (pos < 0) {
			return null;
		}

		const beg = homepage.lastIndexOf('<', pos);

		if (beg < 0) {
			return null;
		}

		const end = homepage.indexOf('>', pos);

		if (end < 0) {
			return null;
		}

		const metaTag = homepage.substring(beg, end);
		const match = metaTag.match(/content="([^"]+)"/);

		return match ? match[1] : null;
	}

	async _extractIndices(ondemandS) {
		const url = `https://abs.twimg.com/responsive-web/client-web/ondemand.s.${ondemandS}a.js`;
		const response = await fetch(url, {
			headers: { 'User-Agent': USER_AGENT }
		});
		const page = await response.text();
		const pattern = /\(\w\[(\d\d?)\],\s*16\)/g;
		const indices = [];
		let match;

		while ((match = pattern.exec(page)) !== null) {
			indices.push(parseInt(match[1], 10));
		}

		return indices;
	}

	_extractFrames(homepage) {
		const frames = [];
		const begin = 'id="loading-x-anim-';
		const end = '</svg>';
		let pos = 0;

		while (true) {
			const beginPos = homepage.indexOf(begin, pos);

			if (beginPos < 0) {
				break;
			}

			const contentStart = beginPos + begin.length;
			const endPos = homepage.indexOf(end, contentStart);

			if (endPos < 0) {
				break;
			}

			frames.push(homepage.substring(contentStart, endPos));
			pos = endPos + end.length;
		}

		return frames;
	}

	_calculateAnimationKey(frames, rowIndex, keyBytes, keyBytesIndices, totalTime = 4096) {
		const frame = frames[keyBytes[5] % 4];
		const array = this._generate2DArray(frame);
		const frameRow = array[keyBytes[rowIndex] % 16];

		let frameTime = 1;

		for (const index of keyBytesIndices) {
			frameTime *= keyBytes[index] % 16;
		}

		frameTime = roundJs(frameTime / 10) * 10;

		const targetTime = frameTime / totalTime;

		return this._animate(frameRow, targetTime);
	}

	_generate2DArray(frame) {
		const d = this._extr(frame, '</path><path d="', '"');

		if (!d) {
			return [];
		}

		const segments = d.slice(9).split('C');

		return segments.map((segment) =>
			segment
				.split(/[^\d]+/)
				.filter((x) => x !== '')
				.map(Number)
		);
	}

	_animate(frames, targetTime) {
		const curve = frames.slice(7).map((frame, index) => scale(Number(frame), isOdd(index), 1.0, false));
		const cubic = cubicValue(curve, targetTime);

		const colorA = [Number(frames[0]), Number(frames[1]), Number(frames[2])];
		const colorB = [Number(frames[3]), Number(frames[4]), Number(frames[5])];
		const color = interpolateList(cubic, colorA, colorB).map((c) => {
			if (c <= 0.0) {
				return 0.0;
			}

			if (c >= 255.0) {
				return 255.0;
			}

			return c;
		});

		const rotationA = 0.0;
		const rotationB = scale(Number(frames[6]), 60.0, 360.0, true);
		const rotation = interpolateValue(cubic, rotationA, rotationB);
		const matrix = rotationMatrix2d(rotation);

		const result = [
			Math.round(color[0]).toString(16),
			Math.round(color[1]).toString(16),
			Math.round(color[2]).toString(16),
			floatToHex(Math.abs(Math.round(matrix[0] * 100) / 100)),
			floatToHex(Math.abs(Math.round(matrix[1] * 100) / 100)),
			floatToHex(Math.abs(Math.round(matrix[2] * 100) / 100)),
			floatToHex(Math.abs(Math.round(matrix[3] * 100) / 100)),
			'00'
		];

		return result.join('').replace(/\./g, '').replace(/-/g, '');
	}

	generateTransactionId(method, path, keyword = 'obfiowerehiring', rndnum = 3) {
		const bytesKey = this.keyBytes;

		const nowf = Date.now() / 1000;
		const nowi = Math.floor(nowf);
		const now = nowi - 1682924400;
		const bytesTime = [now & 0xff, (now >> 8) & 0xff, (now >> 16) & 0xff, (now >> 24) & 0xff];

		const payload = `${method}!${path}!${now}${keyword}${this.animationKey}`;
		const hash = crypto.createHash('sha256').update(payload).digest();
		const bytesHash = hash.slice(0, 16);

		const num = (Math.floor(Math.random() * 16) << 4) + Math.floor((nowf - nowi) * 16.0);

		const bytes = [0, ...bytesKey, ...bytesTime, ...bytesHash, rndnum];
		const xored = Buffer.from(bytes.map((b) => b ^ num));

		return xored.toString('base64').replace(/=+$/, '');
	}
}

export const getClientTransactionId = async (method, path) => {
	if (!instance) {
		if (!initPromise) {
			initPromise = (async () => {
				const client = new ClientTransaction();

				await client.initialize();
				instance = client;
			})();
		}

		await initPromise;
	}

	return instance.generateTransactionId(method, path);
};

export const resetClientTransaction = () => {
	instance = null;
	initPromise = null;
};
