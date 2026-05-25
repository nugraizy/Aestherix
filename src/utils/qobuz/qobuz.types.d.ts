export type TrackQuality = 5 | 6 | 7 | 27 | 28 | 29 | 30;

export type QualityFormat = 'MP3' | 'FLAC' | 'AIFF' | 'ALAC';

export type QobuzTrackMetadata = {
	title: string;
	artist: string;
	album: string;
	year: string;
	trackNumber: string;
	genre: string;
	copyright: string;
	pictureUrl: string;
};

export type QobuzNormalizedArtist = {
	id: number | string | null;
	name: string;
	image: string | null;
	genre: string;
};

export type QobuzNormalizedAlbum = {
	raw: Record<string, unknown>;
	id: number | string | null;
	title: string;
	artist: QobuzNormalizedArtist | null;
	artists: Array<{ id: number | string | null; name: string }>;
	image: string | null;
	genre: string;
	releasedAt: number | null;
	copyright: string;
	trackCount: number | null;
};

export type QobuzNormalizedTrack = {
	raw: Record<string, unknown>;
	id: number | string | null;
	title: string;
	duration: number | null;
	trackNumber: number | null;
	artist: QobuzNormalizedArtist | null;
	artists: Array<{ id: number | string | null; name: string }>;
	album: {
		raw: Record<string, unknown>;
		id: number | string | null;
		title: string;
		image: string | null;
		releasedAt: number | null;
		genre: string;
	} | null;
	copyright: string;
	maximumBitDepth: number | null;
	maximumSampleRate: number | null;
	maximumChannelCount: number | null;
};

export type QobuzWrappedTrack = QobuzNormalizedTrack & {
	download: (quality?: TrackQuality) => Promise<QobuzDownloadResult | string>;
	metadata: (album?: QobuzNormalizedAlbum | null) => QobuzTrackMetadata;
};

export type QobuzWrappedAlbum = QobuzNormalizedAlbum & {
	download: () => Promise<QobuzAlbumResult | string>;
};

export type QobuzDownloadFile = {
	url: string;
	trackId: string;
	etsp: string | null;
	hmac: string | null;
	uid: string | null;
	fmt: string | null;
	profile: string;
	format: QualityFormat;
	ext: string;
	quality: TrackQuality;
};

export type QobuzDownloadResult = {
	file: QobuzDownloadFile;
	url: string;
	domain: string | null;
	track: QobuzNormalizedTrack;
	cover: string | null;
};

export type QobuzAlbumResult = QobuzNormalizedAlbum & {
	tracks: QobuzWrappedTrack[];
};

export type QobuzFriendlyError = string;

export declare class Qobuz {
	trackCache: Map<string, QobuzWrappedTrack>;

	get search(): {
		tracks: (query: string, offset?: number) => Promise<QobuzWrappedTrack[] | QobuzFriendlyError>;
		albums: (query: string, offset?: number) => Promise<QobuzWrappedAlbum[] | QobuzFriendlyError>;
		artists: (query: string, offset?: number) => Promise<QobuzNormalizedArtist[] | QobuzFriendlyError>;
	};

	getTrack(id: string | number): QobuzWrappedTrack | null;
	parseMetadata(track: Record<string, unknown>, album?: Record<string, unknown> | null): QobuzTrackMetadata;
	searchTracks(query: string, offset?: number): Promise<QobuzWrappedTrack[] | QobuzFriendlyError>;
	searchAlbums(query: string, offset?: number): Promise<QobuzWrappedAlbum[] | QobuzFriendlyError>;
	searchArtists(query: string, offset?: number): Promise<QobuzNormalizedArtist[] | QobuzFriendlyError>;
	download(
		id: string | number,
		quality?: TrackQuality
	): Promise<{ file: QobuzDownloadFile; url: string; domain: string | null } | QobuzFriendlyError>;
	getAlbum(id: string | number): Promise<QobuzAlbumResult | QobuzFriendlyError>;
}

export declare const qobuz: Qobuz;

export declare function extractMetadata(
	track: Record<string, unknown>,
	album?: Record<string, unknown> | null
): QobuzTrackMetadata;
export declare function metadata(track: Record<string, unknown>, songUrl: string, coverUrl?: string | null): Promise<Buffer>;
