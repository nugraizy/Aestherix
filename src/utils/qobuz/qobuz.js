import { QobuzApi } from './utils/api.qobuz.js';
import { extractMetadata } from './utils/metadata.js';

const pickImage = (image) => image?.large || image?.thumbnail || image?.small || null;

function normalizeArtist(artist) {
	if (!artist) {return null;}

	return {
		id: artist.id ?? null,
		name: artist.name ?? '',
		image: pickImage(artist.image),
		genre: artist.genre?.name ?? ''
	};
}

function normalizeArtists(artists) {
	return (Array.isArray(artists) ? artists : [])
		.filter((a) => a && (a.id !== undefined || a.name))
		.map((a) => ({ id: a.id ?? null, name: a.name ?? '' }));
}

function normalizeAlbum(album) {
	if (!album) {return null;}

	return {
		raw: album,
		id: album.id ?? null,
		title: album.title ?? '',
		artist: normalizeArtist(album.artist) || normalizeArtist(album.artists?.[0]),
		artists: normalizeArtists(album.artists),
		image: pickImage(album.image),
		genre: album.genre?.name ?? '',
		releasedAt: album.released_at ?? null,
		copyright: album.copyright ?? '',
		trackCount: album.track_count ?? null
	};
}

function normalizeTrack(track, albumOverride) {
	if (!track) {return null;}

	const albumSource = track.album || albumOverride || null;
	const artist =
		normalizeArtist(track.performer) ||
		normalizeArtist(track.artists?.[0]) ||
		normalizeArtist(albumSource?.artist);

	return {
		raw: track,
		id: track.id ?? null,
		title: track.title ?? '',
		duration: track.duration ?? null,
		trackNumber: track.track_number ?? null,
		artist,
		artists: normalizeArtists(track.artists),
		album: albumSource
			? {
					raw: albumSource,
					id: albumSource.id ?? null,
					title: albumSource.title ?? '',
					image: pickImage(albumSource.image),
					releasedAt: albumSource.released_at ?? null,
					genre: albumSource.genre?.name ?? ''
				}
			: null,
		copyright: track.copyright ?? albumSource?.copyright ?? '',
		maximumBitDepth: track.maximum_bit_depth ?? null,
		maximumSampleRate: track.maximum_sample_rate ?? null,
		maximumChannelCount: track.maximum_channel_count ?? null
	};
}

class Qobuz {
	constructor(api = new QobuzApi()) {
		this.api = api;
		this.trackCache = new Map();
	}

	get search() {
		return {
			tracks: (query, offset) => this.searchTracks(query, offset),
			albums: (query, offset) => this.searchAlbums(query, offset),
			artists: (query, offset) => this.searchArtists(query, offset)
		};
	}

	getTrack(id) {
		return this.trackCache.get(String(id)) || null;
	}

	parseMetadata(track, album) {
		if (!track) {
			return { title: '', artist: '', album: '', year: '', trackNumber: '', genre: '', copyright: '', pictureUrl: '' };
		}

		return extractMetadata(track, album ?? track.album ?? null);
	}

	async searchTracks(query, offset = 0) {
		if (!query) {throw new Error('Query is required');}

		try {
			const payload = await this.api.searchTracks(query, offset);
			const tracks = (payload?.items ?? []).map(normalizeTrack).map((t) => this.#wrapTrack(t));

			for (const track of tracks) {
				this.trackCache.set(String(track.id), track);
			}

			return tracks;
		} catch (error) {
			return this.#friendlyError(error);
		}
	}

	async searchAlbums(query, offset = 0) {
		if (!query) {throw new Error('Query is required');}

		try {
			const payload = await this.api.searchAlbums(query, offset);

			return (payload?.items ?? []).map(normalizeAlbum).map((a) => this.#wrapAlbum(a));
		} catch (error) {
			return this.#friendlyError(error);
		}
	}

	async searchArtists(query, offset = 0) {
		if (!query) {throw new Error('Query is required');}

		try {
			const payload = await this.api.searchArtists(query, offset);

			return (payload?.items ?? []).map(normalizeArtist);
		} catch (error) {
			return this.#friendlyError(error);
		}
	}

	async download(id, quality = 27) {
		if (!id) {throw new Error('ID is required');}

		try {
			const file = await this.api.getTrackDownload(id, quality);

			if (!file?.url) {
				throw new Error('Could not retrieve download URL');
			}

			return { file, url: file.url, domain: this.api.domain ?? null };
		} catch (error) {
			return this.#friendlyError(error);
		}
	}

	async getAlbum(id) {
		if (!id) {throw new Error('ID is required');}

		try {
			const response = await this.api.getAlbum(id);
			const album = normalizeAlbum(response);
			const tracks = (response?.tracks?.items ?? [])
				.map((t) => normalizeTrack(t, response))
				.map((t) => this.#wrapTrack(t));

			return { ...(album || { id: null, title: '', artist: null, artists: [], image: null, genre: '', releasedAt: null, copyright: '', trackCount: null }), tracks };
		} catch (error) {
			return this.#friendlyError(error);
		}
	}

	#wrapTrack(track) {
		if (!track) {return track;}

		return {
			...track,
			download: async (quality = 27) => {
				const result = await this.download(track.id, quality);

				if (typeof result === 'string') {return result;}

				return { ...result, track, cover: track.album?.image || track.album?.raw?.image?.large || null };
			},
			metadata: (album) => {
				const fallback = track.album?.raw ?? track.album ?? track.raw?.album ?? null;

				return this.parseMetadata(track.raw ?? track, album?.raw ?? album ?? fallback);
			}
		};
	}

	#wrapAlbum(album) {
		if (!album) {return album;}

		return { ...album, download: () => this.getAlbum(album.id) };
	}

	#friendlyError(error) {
		if (error?.message?.includes('Too Many Requests')) {
			return 'Too Many Requests. Try again later.';
		}

		return error?.message || 'Request failed. Try again later.';
	}
}

export const qobuz = new Qobuz();
export { Qobuz };
