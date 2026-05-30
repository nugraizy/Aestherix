import { ErrInvalidPlaylist, ErrPlaylistStatus, YoutubeError } from './errors.js';
import { prepareInnertubePlaylistData } from './clients.js';

const playlistIdRegex = /^[A-Za-z0-9_-]{13,42}$/;
const playlistInUrlRegex = /[&?]list=([A-Za-z0-9_-]{13,42})(&.*)?$/;

function runsText(node) {
	if (!node) {
		return '';
	}

	if (typeof node === 'string') {
		return node;
	}

	if (typeof node.simpleText === 'string') {
		return node.simpleText;
	}

	if (Array.isArray(node.runs)) {
		return node.runs.map((r) => r.text || '').join('');
	}

	if (typeof node.text === 'string') {
		return node.text;
	}

	return '';
}

function getText(node, ...paths) {
	let cur = node;

	for (const path of paths) {
		if (cur && cur[path] !== undefined && cur[path] !== null) {
			cur = cur[path];
		}
	}

	return runsText(cur);
}

function firstKeyValue(obj) {
	if (!obj || typeof obj !== 'object') {
		return obj;
	}

	for (const key of Object.keys(obj)) {
		return obj[key];
	}

	return obj;
}

function getContinuationToken(node) {
	return node?.continuations?.[0]?.nextContinuationData?.continuation || '';
}

export class PlaylistEntry {
	constructor({ id, title, author, durationSeconds, thumbnails }) {
		this.id = id;
		this.title = title;
		this.author = author;
		this.durationSeconds = durationSeconds;
		this.thumbnails = thumbnails;
	}
}

function extractPlaylistEntries(items) {
	const entries = [];
	let continuation = '';

	for (const item of items || []) {
		const renderer = item.playlistVideoRenderer;

		if (!renderer) {
			const token = item.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;

			if (token) {
				continuation = token;
			}

			continue;
		}

		entries.push(
			new PlaylistEntry({
				id: renderer.videoId,
				title: runsText(renderer.title),
				author: runsText(renderer.shortBylineText),
				durationSeconds: parseInt(renderer.lengthSeconds, 10) || 0,
				thumbnails: renderer.thumbnail?.thumbnails || []
			})
		);
	}

	return { entries, continuation };
}

export class Playlist {
	constructor(id = '') {
		this.id = id;
		this.title = '';
		this.description = '';
		this.author = '';
		this.videos = [];
	}

	static extractID(url) {
		if (playlistIdRegex.test(url)) {
			return url;
		}

		const match = playlistInUrlRegex.exec(url);

		if (match) {
			return match[1];
		}

		throw new ErrInvalidPlaylist();
	}

	async parsePlaylistInfo(client, body, clientInfo = client.client) {
		const json = JSON.parse(body);

		const alert = json.alerts?.[0]?.alertRenderer;

		if (alert && alert.type === 'ERROR') {
			throw new ErrPlaylistStatus(runsText(alert.text));
		}

		const metadata =
			json.metadata?.playlistMetadataRenderer || json.header?.playlistHeaderRenderer || json.metadata || json.header;

		if (!metadata) {
			throw new YoutubeError('no playlist header / metadata found');
		}

		this.title = getText(metadata, 'title');
		this.description = getText(metadata, 'description', 'descriptionText');
		this.author =
			json.sidebar?.playlistSidebarRenderer?.items?.[1]?.playlistSidebarSecondaryInfoRenderer?.videoOwner?.videoOwnerRenderer
				?.title?.runs?.[0]?.text || '';

		if (!this.author) {
			this.author = getText(metadata, 'owner', 'ownerText');
		}

		if (!json.contents) {
			throw new YoutubeError('contents not found in json body');
		}

		let firstPart = firstKeyValue(json.contents)?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0];
		const nested = firstPart?.itemSectionRenderer?.contents?.[0];

		if (nested) {
			firstPart = nested;
		}

		const listRenderer = firstPart?.playlistVideoListRenderer;

		if (!listRenderer?.contents) {
			throw new YoutubeError('no video data found in JSON');
		}

		let { entries, continuation } = extractPlaylistEntries(listRenderer.contents);

		if (!continuation) {
			continuation = getContinuationToken(listRenderer);
		}

		if (entries.length === 0) {
			throw new YoutubeError('no videos found in playlist');
		}

		this.videos = entries;

		while (continuation) {
			const data = prepareInnertubePlaylistData(continuation, true, clientInfo);
			const nextBody = await client.httpPostBody(`https://www.youtube.com/youtubei/v1/browse?key=${clientInfo.key}`, data);
			const nextJson = JSON.parse(nextBody);

			let nextItems = nextJson.onResponseReceivedActions?.[0]?.appendContinuationItemsAction?.continuationItems;
			const continuationContents = nextJson.continuationContents?.playlistVideoListContinuation;

			if (!nextItems) {
				nextItems = continuationContents?.contents;
			}

			const result = extractPlaylistEntries(nextItems);

			continuation = result.continuation || getContinuationToken(continuationContents);
			this.videos.push(...result.entries);
		}
	}
}
