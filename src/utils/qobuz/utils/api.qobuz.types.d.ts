export type SearchType = 'tracks' | 'albums' | 'artists';

/** Numeric quality levels accepted by getTrackDownload. */
export type TrackQuality = 5 | 6 | 7 | 27 | 28 | 29 | 30;

/** Arbitrary JSON object returned by API endpoints. */
export type QobuzApiJson = Record<string, any>;

/** Plain text returned when content-type is not JSON. */
export type QobuzApiText = string;

/** Fields injected by QobuzApi into every JSON response. */
export type QobuzBaseResponse = {
	version?: string;
	domain?: string;
};

/** Common paged container used by search endpoints. */
export type QobuzPagedItems<T = any> = {
	limit?: number;
	offset?: number;
	totalNumberOfItems?: number;
	items?: T[];
};

export type QobuzArtistRef = {
	id?: number | string;
	name?: string;
	image?: { small?: string; large?: string; thumbnail?: string };
	genre?: { id?: number | string; name?: string };
};

export type QobuzAlbumRef = {
	id?: number | string;
	title?: string;
	artist?: QobuzArtistRef;
	artists?: QobuzArtistRef[];
	image?: { small?: string; large?: string; thumbnail?: string };
	genre?: { id?: number | string; name?: string };
	released_at?: number;
	copyright?: string;
	track_count?: number;
};

export type QobuzTrackItem = {
	id?: number | string;
	title?: string;
	track_number?: number;
	duration?: number;
	performer?: QobuzArtistRef;
	artists?: QobuzArtistRef[];
	album?: QobuzAlbumRef;
	copyright?: string;
	is_playable?: boolean;
	maximum_bit_depth?: number;
	maximum_channel_count?: number;
	maximum_sample_rate?: number;
	format?: {
		sample_rate?: number;
		bit_depth?: number;
		channels?: number;
		channel_layout?: string;
	};
};

export type QobuzSearchTrackResponse = QobuzBaseResponse & {
	items?: QobuzTrackItem[];
	totalNumberOfItems?: number;
	limit?: number;
	offset?: number;
};

export type QobuzSearchAlbumResponse = QobuzBaseResponse & {
	items?: QobuzAlbumRef[];
	totalNumberOfItems?: number;
	limit?: number;
	offset?: number;
};

export type QobuzSearchArtistResponse = QobuzBaseResponse & {
	items?: QobuzArtistRef[];
	totalNumberOfItems?: number;
	limit?: number;
	offset?: number;
};

export type QobuzAlbumResponse = QobuzBaseResponse & {
	id?: number | string;
	title?: string;
	artist?: QobuzArtistRef;
	artists?: QobuzArtistRef[];
	image?: { small?: string; large?: string; thumbnail?: string };
	genre?: { id?: number | string; name?: string };
	released_at?: number;
	copyright?: string;
	tracks?: { items?: QobuzTrackItem[] };
	label?: { name?: string };
};

export type QobuzDownloadData = {
	url: string;
	trackId?: string;
	format_id?: number;
	mime_type?: string;
	expires_at?: number;
};

export type QobuzDownloadResponse = QobuzBaseResponse &
	QobuzDownloadData & {
		etsp?: string | null;
		hmac?: string | null;
		uid?: string | null;
		fmt?: string | null;
		profile?: string;
		format?: string;
		ext?: string;
		quality?: TrackQuality;
	};

export type QobuzApiResponse =
	| QobuzSearchTrackResponse
	| QobuzSearchAlbumResponse
	| QobuzSearchArtistResponse
	| QobuzAlbumResponse
	| QobuzDownloadResponse
	| (QobuzBaseResponse & QobuzApiJson);
