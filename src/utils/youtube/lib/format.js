export class Format {
	constructor(raw = {}) {
		this.itag = raw.itag ?? 0;
		this.url = raw.url ?? '';
		this.mimeType = raw.mimeType ?? '';
		this.quality = raw.quality ?? '';
		this.cipher = raw.signatureCipher ?? '';
		this.bitrate = raw.bitrate ?? 0;
		this.fps = raw.fps ?? 0;
		this.width = raw.width ?? 0;
		this.height = raw.height ?? 0;
		this.lastModified = raw.lastModified ?? '';
		this.contentLength = raw.contentLength ? Number(raw.contentLength) : 0;
		this.qualityLabel = raw.qualityLabel ?? '';
		this.projectionType = raw.projectionType ?? '';
		this.averageBitrate = raw.averageBitrate ?? 0;
		this.audioQuality = raw.audioQuality ?? '';
		this.approxDurationMs = raw.approxDurationMs ?? '';
		this.audioSampleRate = raw.audioSampleRate ?? '';
		this.audioChannels = raw.audioChannels ?? 0;
		this.initRange = raw.initRange ?? null;
		this.indexRange = raw.indexRange ?? null;
		this.audioTrack = raw.audioTrack ?? null;
	}

	languageDisplayName() {
		return this.audioTrack ? this.audioTrack.displayName : '';
	}
}

function codecRank(mimeType, table) {
	for (const [needle, rank] of table) {
		if (mimeType.includes(needle)) {
			return rank;
		}
	}

	return 0;
}

const videoCodecs = [
	['av01', 1],
	['vp9', 2],
	['avc1', 3]
];

const audioCodecs = [
	['mp4', 1],
	['opus', 2]
];

function formatIsBefore(a, b) {
	if (a.width !== b.width) {
		return a.width > b.width;
	}

	if (a.itag === 137) {
		return false;
	}

	if (b.itag === 137) {
		return true;
	}

	if (a.fps !== b.fps) {
		return a.fps > b.fps;
	}

	const isAudio = a.fps === 0 && a.audioChannels > 0 && b.audioChannels > 0;

	if (isAudio) {
		const sameDefault =
			(a.audioTrack === null && b.audioTrack === null) ||
			(a.audioTrack !== null && b.audioTrack !== null && a.audioTrack.audioIsDefault === b.audioTrack.audioIsDefault);

		if (sameDefault) {
			const ca = codecRank(a.mimeType, audioCodecs);
			const cb = codecRank(b.mimeType, audioCodecs);

			if (ca !== cb) {
				return ca < cb;
			}

			if (a.audioChannels !== b.audioChannels) {
				return a.audioChannels > b.audioChannels;
			}

			if (a.bitrate !== b.bitrate) {
				return a.bitrate > b.bitrate;
			}

			return a.audioSampleRate > b.audioSampleRate;
		}

		return a.audioTrack !== null && a.audioTrack.audioIsDefault;
	}

	const ca = codecRank(a.mimeType, videoCodecs);
	const cb = codecRank(b.mimeType, videoCodecs);

	if (ca !== cb) {
		return ca < cb;
	}

	return a.bitrate > b.bitrate;
}

export class FormatList extends Array {
	static fromFormats(formats) {
		const list = new FormatList();

		for (const f of formats) {
			list.push(f instanceof Format ? f : new Format(f));
		}

		return list;
	}

	select(predicate) {
		const result = new FormatList();

		for (const f of this) {
			if (predicate(f)) {
				result.push(f);
			}
		}

		return result;
	}

	itag(itagNo) {
		return this.select((f) => f.itag === itagNo);
	}

	type(value) {
		return this.select((f) => f.mimeType.includes(value));
	}

	language(displayName) {
		return this.select((f) => f.languageDisplayName() === displayName);
	}

	quality(quality) {
		const itag = parseInt(quality, 10);

		return this.select((f) => itag === f.itag || f.quality.includes(quality) || f.qualityLabel.includes(quality));
	}

	audioChannels(n) {
		return this.select((f) => f.audioChannels === n);
	}

	withAudioChannels() {
		return this.select((f) => f.audioChannels > 0);
	}

	sort() {
		super.sort((a, b) => {
			if (formatIsBefore(a, b)) {
				return -1;
			}

			if (formatIsBefore(b, a)) {
				return 1;
			}

			return 0;
		});
		return this;
	}

	sortByBitrateDesc() {
		super.sort((a, b) => b.bitrate - a.bitrate);
		return this;
	}
}
