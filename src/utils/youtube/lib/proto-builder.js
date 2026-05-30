export class ProtoBuilder {
	constructor() {
		this.bytes = [];
	}

	toBytes() {
		return Buffer.from(this.bytes);
	}

	toUrlEncodedBase64() {
		const b64 = this.toBytes().toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

		return encodeURIComponent(b64);
	}

	writeVarint(value) {
		let val = Math.trunc(value);

		if (val === 0) {
			this.bytes.push(0);
			return;
		}

		while (true) {
			let b = val % 128;

			val = Math.floor(val / 128);

			if (val !== 0) {
				b |= 0x80;
			}

			this.bytes.push(b);

			if (val === 0) {
				break;
			}
		}
	}

	field(field, wireType) {
		this.writeVarint(field * 8 + (wireType & 0x07));
	}

	varint(field, value) {
		this.field(field, 0);
		this.writeVarint(value);
	}

	string(field, value) {
		this.appendBytes(field, Buffer.from(value, 'binary'));
	}

	appendBytes(field, value) {
		this.field(field, 2);
		this.writeVarint(value.length);

		for (const byte of value) {
			this.bytes.push(byte);
		}
	}
}
