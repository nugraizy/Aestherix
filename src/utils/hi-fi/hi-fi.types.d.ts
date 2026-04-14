import type {
	ParsedMixTrack,
	TidalAlbumResponse,
	TidalInfoResponse,
	TidalSearchGroupedResponse,
	TidalSearchTrackResponse,
	TidalTrackResponse
} from './utils/api.tidal.types';

export type ApiErrorPayload = {
	/** Raw error payload returned by endpoint wrappers. */
	error: unknown;
	/** Additional unknown fields preserved from upstream error object. */
	[key: string]: unknown;
};

/** Friendly error message returned by HiFi methods. */
export type HiFiFriendlyError = string;

/** Extracted payload of track-style search results. */
export type HiFiTrackSearchPayload = NonNullable<TidalSearchTrackResponse['data']>;

/** Extracted payload of album-only search bucket. */
export type HiFiAlbumSearchPayload = NonNullable<NonNullable<TidalSearchGroupedResponse['data']['albums']>>;

/** Return type of HiFi.search including success payloads and error forms. */
export type HiFiSearchResult = HiFiTrackSearchPayload | HiFiAlbumSearchPayload | ApiErrorPayload | HiFiFriendlyError;

/** Extracted payload of track stream/download endpoint. */
export type HiFiTrackDownloadPayload = NonNullable<TidalTrackResponse['data']>;

/** Extracted payload of track info endpoint. */
export type HiFiTrackInfoPayload = NonNullable<TidalInfoResponse['data']>;

export type HiFiDownloadResult = {
	/** Track stream/download information, including manifest fields. */
	file: HiFiTrackDownloadPayload;
	/** Track metadata from info endpoint. */
	track: HiFiTrackInfoPayload;
	/** Resolved direct audio URL parsed from manifest. */
	url: string;
	/** Full cover image URL when album cover is available. */
	cover: string | null;
	/** Domain/host used for successful download endpoint call. */
	domain: string | null;
};

/** Return type of HiFi.download including success and error variants. */
export type HiFiDownloadResponse = HiFiDownloadResult | ApiErrorPayload | HiFiFriendlyError;

/** Extracted album payload returned by HiFi.getAlbum on success. */
export type HiFiAlbumPayload = NonNullable<TidalAlbumResponse['data']>;

/** Return type of HiFi.getAlbum including success and error variants. */
export type HiFiAlbumResponse = HiFiAlbumPayload | ApiErrorPayload | HiFiFriendlyError;

export type HiFiMixResponse =
	| {
			/** Normalized list of tracks from selected mix. */
			tracks: ParsedMixTrack[];
			/** Domain/host used for successful mix endpoint call. */
			domain?: string;
	  }
	| ApiErrorPayload
	| HiFiFriendlyError;

/** Internal helper source type accepted by extractPayload-style operations. */
export type HiFiPayloadSource =
	| TidalSearchTrackResponse
	| TidalSearchGroupedResponse
	| TidalTrackResponse
	| TidalInfoResponse
	| TidalAlbumResponse
	| null
	| undefined;
