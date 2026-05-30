export class YoutubeError extends Error {
	constructor(message) {
		super(message);
		this.name = this.constructor.name;
	}
}

export class ErrCipherNotFound extends YoutubeError {
	constructor() {
		super('cipher not found');
	}
}

export class ErrSignatureTimestampNotFound extends YoutubeError {
	constructor() {
		super('signature timestamp not found');
	}
}

export class ErrInvalidCharactersInVideoID extends YoutubeError {
	constructor() {
		super('invalid characters in video id');
	}
}

export class ErrVideoIDMinLength extends YoutubeError {
	constructor() {
		super('the video id must be at least 10 characters long');
	}
}

export class ErrNotPlayableInEmbed extends YoutubeError {
	constructor() {
		super('embedding of this video has been disabled');
	}
}

export class ErrLoginRequired extends YoutubeError {
	constructor() {
		super('login required to confirm your age');
	}
}

export class ErrVideoPrivate extends YoutubeError {
	constructor() {
		super('user restricted access to this video');
	}
}

export class ErrInvalidPlaylist extends YoutubeError {
	constructor() {
		super('no playlist detected or invalid playlist ID');
	}
}

export class ErrNoFormat extends YoutubeError {
	constructor() {
		super('no video format provided');
	}
}

export class ErrPlayabilityStatus extends YoutubeError {
	constructor(status, reason) {
		super(`cannot playback and download, status: ${status}, reason: ${reason}`);
		this.status = status;
		this.reason = reason;
	}
}

export class ErrUnexpectedStatusCode extends YoutubeError {
	constructor(code) {
		super(`unexpected status code: ${code}`);
		this.code = code;
	}
}

export class ErrPlaylistStatus extends YoutubeError {
	constructor(reason) {
		super(`could not load playlist: ${reason}`);
		this.reason = reason;
	}
}
