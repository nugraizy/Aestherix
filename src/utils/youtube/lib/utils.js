import { ProtoBuilder } from './proto-builder.js';

export const Size1Kb = 1024;
export const Size1Mb = Size1Kb * 1024;
export const Size10Mb = Size1Mb * 10;
export const ContentPlaybackNonceAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export class Utils {
	static getChunks(totalSize, chunkSize) {
		const chunks = [];

		for (let start = 0; start < totalSize; start += chunkSize) {
			const end = Math.min(start + chunkSize - 1, totalSize - 1);

			chunks.push({ start, end });
		}

		return chunks;
	}

	static base64Enc(str) {
		return Buffer.from(str, 'binary').toString('base64').replace(/=+$/, '');
	}

	static base64PadEnc(str) {
		return Buffer.from(str, 'binary').toString('base64');
	}

	static randString(alphabet, size) {
		let out = '';

		for (let i = 0; i < size; i++) {
			out += alphabet[Math.floor(Math.random() * alphabet.length)];
		}

		return out;
	}

	static randomVisitorData(countryCode) {
		const pbE2 = new ProtoBuilder();

		pbE2.string(2, '');
		pbE2.varint(4, Math.floor(Math.random() * 255) + 1);

		const pbE = new ProtoBuilder();

		pbE.string(1, countryCode);
		pbE.appendBytes(2, pbE2.toBytes());

		const pb = new ProtoBuilder();

		pb.string(1, Utils.randString(ContentPlaybackNonceAlphabet, 11));
		pb.varint(5, Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 600000));
		pb.appendBytes(6, pbE.toBytes());

		return pb.toUrlEncodedBase64();
	}
}
