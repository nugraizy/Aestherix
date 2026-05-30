import { Format, FormatList } from './format.js';
import { ErrLoginRequired, ErrNotPlayableInEmbed, ErrPlayabilityStatus, ErrVideoPrivate, YoutubeError } from './errors.js';

const playerResponsePattern = /var ytInitialPlayerResponse\s*=\s*(\{.+?\});/;

export class Video {
	constructor(id = '') {
		this.id = id;
		this.title = '';
		this.description = '';
		this.author = '';
		this.channelId = '';
		this.channelHandle = '';
		this.views = 0;
		this.durationSeconds = 0;
		this.publishDate = null;
		this.formats = new FormatList();
		this.thumbnails = [];
		this.dashManifestUrl = '';
		this.hlsManifestUrl = '';
		this.captionTracks = [];
	}

	parseVideoInfo(body) {
		const prData = typeof body === 'string' ? JSON.parse(body) : body;

		this.checkDownloadable(prData, false);
		this.extractDataFromPlayerResponse(prData);
	}

	parseVideoPage(body) {
		const html = typeof body === 'string' ? body : body.toString();
		const match = playerResponsePattern.exec(html);

		if (!match) {
			throw new YoutubeError("no ytInitialPlayerResponse found in the server's answer");
		}

		const prData = JSON.parse(match[1]);

		this.checkDownloadable(prData, true);
		this.extractDataFromPlayerResponse(prData);
	}

	checkDownloadable(prData, isVideoPage) {
		const status = prData.playabilityStatus || {};

		switch (status.status) {
			case 'OK':
				return;
			case 'LOGIN_REQUIRED':
				if ((status.reason || '').startsWith('This video is private')) {
					throw new ErrVideoPrivate();
				}

				throw new ErrLoginRequired();
		}

		if (!isVideoPage && !status.playableInEmbed) {
			throw new ErrNotPlayableInEmbed();
		}

		throw new ErrPlayabilityStatus(status.status, status.reason);
	}

	extractDataFromPlayerResponse(prData) {
		const details = prData.videoDetails || {};
		const microformat = prData.microformat?.playerMicroformatRenderer || {};

		this.title = details.title || '';
		this.description = details.shortDescription || '';
		this.author = details.author || '';
		this.channelId = details.channelId || '';
		this.thumbnails = details.thumbnail?.thumbnails || [];
		this.captionTracks = prData.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];

		const views = parseInt(details.viewCount, 10);

		if (views > 0) {
			this.views = views;
		}

		const detailSeconds = parseInt(details.lengthSeconds, 10);

		if (detailSeconds > 0) {
			this.durationSeconds = detailSeconds;
		}

		const microSeconds = parseInt(microformat.lengthSeconds, 10);

		if (microSeconds > 0) {
			this.durationSeconds = microSeconds;
		}

		if (microformat.publishDate) {
			const date = new Date(microformat.publishDate);

			if (!Number.isNaN(date.getTime())) {
				this.publishDate = date;
			}
		}

		if (microformat.ownerProfileUrl) {
			try {
				const path = new URL(microformat.ownerProfileUrl).pathname;

				if (path.length > 1) {
					this.channelHandle = path.slice(1);
				}
			} catch {
				/* ignore malformed profile URL */
			}
		}

		const streaming = prData.streamingData || {};
		const rawFormats = [...(streaming.formats || []), ...(streaming.adaptiveFormats || [])];

		this.formats = FormatList.fromFormats(rawFormats.map((f) => new Format(f)));

		if (this.formats.length === 0) {
			throw new YoutubeError("no formats found in the server's answer");
		}

		this.formats.sortByBitrateDesc();

		this.hlsManifestUrl = streaming.hlsManifestUrl || '';
		this.dashManifestUrl = streaming.dashManifestUrl || '';
	}

	filterQuality(quality) {
		this.formats = this.formats.quality(quality);
		this.formats.sort();
	}
}
