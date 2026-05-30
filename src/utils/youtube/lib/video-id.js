import { ErrInvalidCharactersInVideoID, ErrVideoIDMinLength } from './errors.js';

const videoRegexpList = [/(?:v|embed|shorts|watch\?v)(?:=|\/)([^"&?/=%]{11})/, /(?:=|\/)([^"&?/=%]{11})/, /([^"&?/=%]{11})/];

export class VideoID {
	static extract(input) {
		let videoID = input;

		if (videoID.includes('youtu') || /["?&/<%=]/.test(videoID)) {
			for (const re of videoRegexpList) {
				const match = re.exec(videoID);

				if (match) {
					videoID = match[1];
				}
			}
		}

		if (/[?&/<%=]/.test(videoID)) {
			throw new ErrInvalidCharactersInVideoID();
		}

		if (videoID.length < 10) {
			throw new ErrVideoIDMinLength();
		}

		return videoID;
	}
}
