import axios from 'axios';
import FormData from 'form-data';
import { fetch } from 'undici';

import { cheerioLOAD } from '../modules/index.js';

class Spotifier {
	#clientId = process.env.SPOTIFY_CLIENT_ID;
	#clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
	#accessToken = process.env.SPOTIFY_ACCESS_TOKEN;
	#refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
	#credentialToken = process.env.SPOTIFY_ACCESS_CREDENTIAL_TOKEN;
	#token = `Basic ${new Buffer.from(`${this.#clientId}:${this.#clientSecret}`).toString('base64')}`;
	#bearerToken = null;
	#currentlyPlaying = null;
	#bearerTokenExpiredAt = null;
	#accessTokenExpiredAt = null;
	#_api = 'https://api.spotify.com/v1';
	#_apiAuth = 'https://accounts.spotify.com/api/token';
	device_id = process.env.SPOTIFY_DEVICE_ID;
	constructor() {
		if (!(this.#clientId || this.#clientSecret)) {
			throw new Error('Please add CLIENT_ID and CLIENT_SECRET to your .env files');
		}

		/**
		 * @private
		 */
		this._tokenize = () => {
			return {
				url: this.#_apiAuth,
				method: 'POST',
				headers: {
					Authorization: this.#token
				},
				body: new URLSearchParams({ grant_type: 'client_credentials' })
			};
		};

		/**
		 * @private
		 */
		this._req = async (path, method, opts) => {
			try {
				if (this.#bearerToken === null) {
					await this._refreshToken();
				}

				if (this.#bearerTokenExpiredAt < Date.now()) {
					await this._refreshToken();
				}

				const data = await (
					await fetch(this.#_api + path, {
						method,
						headers: {
							...(opts !== undefined && 'headers' in opts ? opts.headers : {}),
							Authorization: `Bearer ${this.#bearerToken}`
						},
						...(opts !== undefined && 'data' in opts ? { body: opts } : {})
					})
				).json();

				return { status: true, ...data };
			} catch (err) {
				return { status: false, message: err.message };
			}
		};

		/**
		 * @private
		 */
		this._updateCredential = (clientId, clientSecret) => {
			if (!clientId) {
				return { status: false, message: 'Parameter clientId must provided' };
			}

			if (!clientSecret) {
				return { status: false, message: 'Parameter clientSecret must provided' };
			}

			this.#clientId = clientId;
			this.#clientSecret = clientSecret;
			return { status: true, message: 'Credential Updated' };
		};

		/**
		 * @private
		 */
		this._refreshToken = async () => {
			try {
				const { url, body, headers, method } = this._tokenize();

				const data = await (await fetch(url, { body, headers, method })).json();

				this.#bearerToken = data.access_token;
				this.#bearerTokenExpiredAt = Date.now() + data.expires_in;
				return { status: true, message: 'Success to refresh token' };
			} catch (err) {
				return { status: false, message: err.message };
			}
		};

		/**
		 * @private
		 */
		this._getAccessTokenFromRefreshToken = async () => {
			if (this.#accessTokenExpiredAt && Date.now() < this.#accessTokenExpiredAt) {
				return;
			}

			const params = new URLSearchParams();

			params.append('client_id', this.#clientId);
			params.append('client_secret', this.#clientSecret);
			params.append('grant_type', 'refresh_token');
			params.append('refresh_token', this.#refreshToken);
			const { access_token: accessToken, expires_in: expiresIn } = await (
				await fetch('https://accounts.spotify.com/api/token', {
					method: 'POST',
					body: params
				})
			).json();

			this.#accessToken = accessToken;
			this.#accessTokenExpiredAt = Date.now() + expiresIn;
			return { status: true, message: 'Success getting access token' };
		};

		this.getPlaylists = async (playlistsID) => {
			try {
				if (!playlistsID) {
					return { status: false, message: 'Parameter playlistsID must provided' };
				}

				return { status: true, ...(await this._req(`/playlists/${playlistsID}`, 'GET')), ...this };
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.getAlbum = async (albumID) => {
			try {
				if (!albumID) {
					return { status: false, message: 'Parameter albumID must provided' };
				}

				return { status: true, ...(await this._req(`/albums?ids=${albumID}`, 'GET')) };
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.getAlbumTracks = async (albumID) => {
			try {
				if (!albumID) {
					return { status: false, message: 'Parameter albumID must provided' };
				}

				return { status: true, ...(await this._req(`/albums/${albumID}/tracks`, 'GET')) };
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.getArtists = async (artistsID) => {
			try {
				if (!artistsID) {
					return { status: false, message: 'Parameter artistsID must provided' };
				}

				return { status: true, ...(await this._req(`/artists?ids=${artistsID}`, 'GET')) };
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.getArtistsAlbums = async (artistsID) => {
			try {
				if (!artistsID) {
					return { status: false, message: 'Parameter artistsID must provided' };
				}

				return { status: true, ...(await this._req(`/artists?ids=${artistsID}/albums`, 'GET')) };
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.getArtistsTopTracks = async (artistsID) => {
			try {
				if (!artistsID) {
					return { status: false, message: 'Parameter artistsID must provided' };
				}

				let data = await (
					await fetch('https://accounts.spotify.com/api/token?grant_type=client_credentials', {
						headers: {
							Authorization: `Basic ${new Buffer.from(`${this.#clientId}:${this.#clientSecret}`).toString('base64')}`
						},
						method: 'POST'
					})
				).json();

				data = (
					await (
						await fetch(`https://api.spotify.com/v1/artists/${artistsID}/top-tracks?country=US`, {
							headers: {
								Authorization: `Bearer ${this.#credentialToken || data.access_token}`
							},
							method: 'GET'
						})
					).json()
				).data;
				return { status: true, data };
			} catch (err) {
				return { status: false, message: err };
			}
		};
		this.getTracks = async (tracksID) => {
			try {
				if (!tracksID) {
					return { status: false, message: 'Parameter tracksID must provided' };
				}

				const { tracks } = await this._req(`/tracks?ids=${tracksID}`, 'GET');

				if (!tracks.length) {
					return { status: false, message: 'Not Found' };
				}

				tracks[0].download = async () => {
					return await this.download(tracks[0].external_urls.spotify);
				};

				return { status: true, tracks };
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.getTracksAudioAnalysis = async (tracksID) => {
			try {
				if (!tracksID) {
					return { status: false, message: 'Parameter tracksID must provided' };
				}

				return { status: true, ...(await this._req(`/audio-analysis/${tracksID}`, 'GET')) };
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.getTracksAudioFeatures = async (tracksID) => {
			try {
				if (!tracksID) {
					return { status: false, message: 'Parameter tracksID must provided' };
				}

				return { status: true, ...(await this._req(`/audio-features?ids=${tracksID}`, 'GET')) };
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.getNewReleases = async () => {
			try {
				return { status: true, ...(await this._req('/browse/new-releases', 'GET')) };
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.searchTracks = async (query) => {
			try {
				query = encodeURI(query);
				const data = await this._req(`/search?q=${query}&type=track&include_external=audio`, 'GET');

				if (!data.tracks.items.length) {
					return { status: false, message: 'Not Found' };
				}

				data.tracks.items.forEach((_, i) => {
					data.tracks.items[i].download = async () => {
						return this.download(data.tracks.items[i].external_urls.spotify);
					};
				});

				return { status: true, data: data.tracks };
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.searchAlbum = async (query) => {
			try {
				query = encodeURI(query);
				const data = await this._req(`/search?q=album:${query}&type=album&include_external=audio`, 'GET');

				if (!data.albums.items.length) {
					return { status: false, message: 'Not Found' };
				}

				return { status: true, data: data.albums };
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.searchArtist = async (query) => {
			try {
				query = encodeURI(query);
				const data = await this._req(`/search?q=artist:${query}&type=artist&include_external=audio`, 'GET');

				if (!data.artists.items.length) {
					return { status: false, message: 'Not Found' };
				}

				return { status: true, data: data.artists };
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.getCurrentlyPlaying = async () => {
			try {
				await this._getAccessTokenFromRefreshToken();
				const data = await (
					await fetch(`${this.#_api}/me/player/currently-playing`, {
						method: 'GET',
						headers: {
							Authorization: `Bearer ${this.#accessToken}`
						}
					})
				).json();

				return data !== '' ? data : null;
			} catch (err) {
				return { status: false, message: err.response.data.error.message };
			}
		};

		this.getDevices = async () => {
			try {
				await this._getAccessTokenFromRefreshToken();
				const data = await (
					await fetch(`${this.#_api}/me/player/devices`, {
						method: 'GET',
						headers: {
							Authorization: `Bearer ${this.#accessToken}`
						}
					})
				).json();

				return data;
			} catch (err) {
				return { status: false, message: err.response?.data?.error?.message };
			}
		};

		this.getPlaybackState = async () => {
			try {
				await this._getAccessTokenFromRefreshToken();
				const data = await (
					await fetch(`${this.#_api}/me/player`, {
						method: 'GET',
						headers: {
							Authorization: `Bearer ${this.#accessToken}`
						}
					})
				).json();

				return data;
			} catch (err) {
				return { status: false, message: err.response?.data?.error?.message };
			}
		};

		this.updateNowPlayingStates = async () => {
			try {
				await this._getAccessTokenFromRefreshToken();
				const data = await (
					await fetch(`${this.#_api}/me/player/currently-playing`, {
						method: 'GET',
						headers: {
							Authorization: `Bearer ${this.#accessToken}`
						}
					})
				).json();

				if (!data) {
					return false;
				}

				if (data.currently_playing_type === 'ad') {
					return {
						trackTitle: 'Advertisement',
						artists: 'Spotify',
						progressMs: data.progress_ms,
						isPlaying: true
					};
				}

				const {
					name: trackTitle,
					artists,
					duration_ms: durationMs,
					album,
					id: trackId,
					uri: trackUri,
					external_urls // eslint-disable-line camelcase
				} = data.item || {};
				const coverUrl = Array.isArray(album?.images) ? album.images[0]?.url || null : null;
				const trackUrl = external_urls?.spotify || null; // eslint-disable-line camelcase

				this.#currentlyPlaying = data.item.name;

				if (!this.#currentlyPlaying) {
					return false;
				}

				const { progress_ms: progressMs, is_playing: isPlaying } = data;

				return {
					trackTitle,
					artists: artists
						.slice(0, 3)
						.map((v) => v.name)
						.map((v, i) => (artists.length !== 1 && i + 1 === artists.length ? `and ${v}` : v))
						.join(', '),
					trackId: trackId || null,
					trackUri: trackUri || null,
					trackUrl,
					coverUrl,
					durationMs,
					progressMs,
					isPlaying
				};
			} catch (err) {
				return { status: false, message: err.response?.data?.error?.message };
			}
		};

		this.skipPlayback = async () => {
			try {
				await this._getAccessTokenFromRefreshToken();
				const data = await (
					await fetch(`${this.#_api}/me/player/next?device_id=${this.device_id}`, {
						method: 'POST',
						headers: {
							Authorization: `Bearer ${this.#accessToken}`
						}
					})
				).text();

				return data;
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.previousPlayback = async () => {
			try {
				await this._getAccessTokenFromRefreshToken();
				const data = await (
					await fetch(`${this.#_api}/me/player/previous?device_id=${this.device_id}`, {
						method: 'POST',
						headers: {
							Authorization: `Bearer ${this.#accessToken}`
						}
					})
				).text();

				return data;
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.setRepeatState = async (state) => {
			if (!['track', 'context', 'off'].includes(state)) {
				return { status: false, message: 'Invalid state. Use "track", "context", or "off".' };
			}

			try {
				await this._getAccessTokenFromRefreshToken();
				const data = await (
					await fetch(`${this.#_api}/me/player/repeat?device_id=${this.device_id}&state=${state}`, {
						method: 'PUT',
						headers: {
							Authorization: `Bearer ${this.#accessToken}`,
							'Content-Type': 'application/json'
						}
					})
				).text();

				return data;
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.toggleShuffle = async (state) => {
			if (typeof state !== 'boolean') {
				return { status: false, message: 'Invalid state. Use true or false.' };
			}

			try {
				await this._getAccessTokenFromRefreshToken();
				const data = await (
					await fetch(`${this.#_api}/me/player/shuffle?device_id=${this.device_id}`, {
						method: 'PUT',
						body: JSON.stringify({ state }),
						headers: {
							Authorization: `Bearer ${this.#accessToken}`,
							'Content-Type': 'application/json'
						}
					})
				).text();

				return data;
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.pausePlayback = async () => {
			try {
				await this._getAccessTokenFromRefreshToken();
				const data = await (
					await fetch(`${this.#_api}/me/player/pause?device_id=${this.device_id}`, {
						method: 'PUT',
						headers: {
							Authorization: `Bearer ${this.#accessToken}`
						}
					})
				).text();

				return data;
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.addToQueue = async (trackId) => {
			if (!trackId) {
				return { status: false, message: 'Parameter trackId must provided' };
			}

			try {
				await this._getAccessTokenFromRefreshToken();
				const data = await (
					await fetch(`${this.#_api}/me/player/queue?uri=spotify:track:${trackId}&device_id=${this.device_id}`, {
						method: 'POST',
						headers: {
							Authorization: `Bearer ${this.#accessToken}`
						}
					})
				).text();

				return data;
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.resumePlayback = async () => {
			try {
				await this._getAccessTokenFromRefreshToken();
				const data = await (
					await fetch(`${this.#_api}/me/player/play?device_id=${this.device_id}`, {
						method: 'PUT',
						headers: {
							Authorization: `Bearer ${this.#accessToken}`
						}
					})
				).text();

				return data;
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.startNewPlayback = async (input, offset) => {
			if (!input) {
				return { status: false, message: 'Parameter input must provided' };
			}

			if (offset && isNaN(offset)) {
				return { status: false, message: 'Parameter offset must be a number' };
			}

			const trackId =
				input.match(/spotify:track:([a-zA-Z0-9]+)/)?.[1] ||
				input.match(/https?:\/\/open.spotify.com\/track\/([a-zA-Z0-9]+)/)?.[1];
			const albumId =
				input.match(/spotify:album:([a-zA-Z0-9]+)/)?.[1] ||
				input.match(/https?:\/\/open.spotify.com\/album\/([a-zA-Z0-9]+)/)?.[1];
			const playlistId =
				input.match(/spotify:playlist:([a-zA-Z0-9]+)/)?.[1] ||
				input.match(/https?:\/\/open.spotify.com\/playlist\/([a-zA-Z0-9]+)/)?.[1];

			if (!trackId && !albumId && !playlistId) {
				return { status: false, message: 'Invalid input. Must be a valid Spotify track, album, or playlist link.' };
			}

			const body = {
				uris: [],
				context_uri: null,
				position_ms: 0,
				offset: offset ? { position: offset } : undefined
			};

			if (trackId) {
				body.uris.push(`spotify:track:${trackId}`);
			} else if (albumId) {
				body.context_uri = `spotify:album:${albumId}`;
				delete body.uris;
			} else if (playlistId) {
				body.context_uri = `spotify:playlist:${playlistId}`;
				delete body.uris;
			}

			try {
				await this._getAccessTokenFromRefreshToken();
				const data = await (
					await fetch(`${this.#_api}/me/player/play?device_id=${this.device_id}`, {
						method: 'PUT',
						body: JSON.stringify(body),
						headers: {
							Authorization: `Bearer ${this.#accessToken}`,
							'Content-Type': 'application/json'
						}
					})
				).text();

				return data;
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.setVolume = async (volume) => {
			if (isNaN(volume) || volume < 0 || volume > 100) {
				return { status: false, message: 'Volume must be a number between 0 and 100' };
			}

			try {
				await this._getAccessTokenFromRefreshToken();
				const data = await (
					await fetch(`${this.#_api}/me/player/volume?device_id=${this.device_id}&volume_percent=${volume}`, {
						method: 'PUT',
						headers: {
							Authorization: `Bearer ${this.#accessToken}`
						}
					})
				).text();

				return data;
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.download = async (url) => {
			try {
				const $response1 = await axios.get('https://spotifymate.com/', {
					headers: {
						'User-Agent':
							'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36'
					}
				});

				const $text1 = $response1.data;

				const token = $text1.match(/type="hidden" value="(.*)"/)[1];
				const tokenName = $text1.match(/input name="(.*)" type="hidden"/)[1];

				const form = new FormData();

				form.append('url', url);
				form.append(tokenName, token);

				const $response2 = await axios({
					url: 'https://spotifymate.com/action',
					method: 'POST',
					headers: {
						...form.getHeaders(),
						'User-Agent':
							'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 YaBrowser/23.1.5.750 (beta) Yowser/2.5 Safari/537.36',
						Origin: 'https://spotifymate.com',
						Referer: 'https://spotifymate.com/',
						Accept: '*/*',
						Cookie: $response1.headers['set-cookie'].map((v) => v.split(';')[0]).join('; ')
					},
					data: form.getBuffer()
				});

				const $text2 = $response2.data;

				const $ = cheerioLOAD($text2);

				const urlDownload = $('a.abutton.is-success.is-fullwidth').attr('href');

				if (!urlDownload) {
					return { error: true, message: 'Failed to download', url: null };
				}

				return { error: false, message: 'Success', url: urlDownload };
			} catch (err) {
				return { status: false, message: err };
			}
		};
	}
}

export const spotifier = new Spotifier();
