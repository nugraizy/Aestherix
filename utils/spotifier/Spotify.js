import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

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
	#BASE_API = 'https://api.spotify.com/v1';
	#BASE_API_AUTH = 'https://accounts.spotify.com/api/token';
	constructor() {
		if (!(this.#clientId || this.#clientSecret)) {
			throw new Error('Please add CLIENT_ID and CLIENT_SECRET to your .env files');
		}

		this.tokenize = () => {
			return {
				url: this.#BASE_API_AUTH,
				method: 'POST',
				headers: {
					Authorization: this.#token,
				},
				data: 'grant_type=client_credentials',
			};
		};

		this.req = async (path, method, opts) => {
			try {
				if (this.#bearerToken == null) {
					await this.refreshToken();
				}

				if (this.#bearerTokenExpiredAt < Date.now()) {
					await this.refreshToken();
				}

				const { data } = await axios({
					url: this.#BASE_API + path,
					method,
					headers: {
						...(opts !== undefined && 'headers' in opts ? opts.headers : {}),
						Authorization: `Bearer ${this.#bearerToken}`,
					},
					...(opts !== undefined && 'data' in opts ? { data: opts } : {}),
				});

				return { status: true, ...data };
			} catch (err) {
				return { status: false, message: err.message };
			}
		};

		this.updateCredential = (clientId, clientSecret) => {
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

		this.refreshToken = async () => {
			try {
				const { data } = await axios(this.tokenize());

				this.#bearerToken = data.access_token;
				this.#bearerTokenExpiredAt = Date.now() + data.expires_in;
				return { status: true, message: 'Success to refresh token' };
			} catch (err) {
				return { status: false, message: err.message };
			}
		};

		this.getAccessTokenFromRefreshToken = async () => {
			if (this.#accessTokenExpiredAt && Date.now() < this.#accessTokenExpiredAt) {
				return;
			}

			const params = new URLSearchParams();

			params.append('client_id', this.#clientId);
			params.append('client_secret', this.#clientSecret);
			params.append('grant_type', 'refresh_token');
			params.append('refresh_token', this.#refreshToken);
			const {
				data: { access_token: accessToken, expires_in: expiresIn },
			} = await axios({
				url: 'https://accounts.spotify.com/api/token',
				method: 'POST',
				params,
			});

			this.#accessToken = accessToken;
			this.#accessTokenExpiredAt = Date.now() + expiresIn;
			return { status: true, message: 'Success getting access token' };
		};

		this.getPlaylists = async (playlistsID) => {
			try {
				if (!playlistsID) {
					return { status: false, message: 'Parameter playlistsID must provided' };
				}

				return { status: true, ...(await this.req(`/playlists/${playlistsID}`, 'GET')), ...this };
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.getAlbum = async (albumID) => {
			try {
				if (!albumID) {
					return { status: false, message: 'Parameter albumID must provided' };
				}

				return { status: true, ...(await this.req(`/albums?ids=${albumID}`, 'GET')) };
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.getAlbumTracks = async (albumID) => {
			try {
				if (!albumID) {
					return { status: false, message: 'Parameter albumID must provided' };
				}

				return { status: true, ...(await this.req(`/albums/${albumID}/tracks`, 'GET')) };
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.getArtists = async (artistsID) => {
			try {
				if (!artistsID) {
					return { status: false, message: 'Parameter artistsID must provided' };
				}

				return { status: true, ...(await this.req(`/artists?ids=${artistsID}`, 'GET')) };
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.getArtistsAlbums = async (artistsID) => {
			try {
				if (!artistsID) {
					return { status: false, message: 'Parameter artistsID must provided' };
				}

				return { status: true, ...(await this.req(`/artists?ids=${artistsID}/albums`, 'GET')) };
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.getArtistsTopTracks = async (artistsID) => {
			try {
				if (!artistsID) {
					return { status: false, message: 'Parameter artistsID must provided' };
				}

				let { data } = await axios({
					url: 'https://accounts.spotify.com/api/token',
					headers: {
						Authorization: `Basic ${new Buffer.from(`${this.#clientId}:${this.#clientSecret}`).toString('base64')}`,
					},
					params: {
						grant_type: 'client_credentials' /* eslint-disable-line */,
					},
					method: 'POST',
				});

				data = (
					await axios({
						url: `https://api.spotify.com/v1/artists/${artistsID}/top-tracks`,
						headers: {
							Authorization: `Bearer ${this.#credentialToken || data.access_token}`,
						},
						method: 'GET',
						params: {
							country: 'US',
						},
					})
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

				return { status: true, ...(await this.req(`/tracks?ids=${tracksID}`, 'GET')) };
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.getTracksAudioAnalysis = async (tracksID) => {
			try {
				if (!tracksID) {
					return { status: false, message: 'Parameter tracksID must provided' };
				}

				return { status: true, ...(await this.req(`/audio-analysis/${tracksID}`, 'GET')) };
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.getTracksAudioFeatures = async (tracksID) => {
			try {
				if (!tracksID) {
					return { status: false, message: 'Parameter tracksID must provided' };
				}

				return { status: true, ...(await this.req(`/audio-features?ids=${tracksID}`, 'GET')) };
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.getNewReleases = async () => {
			try {
				return { status: true, ...(await this.req('/browse/new-releases', 'GET')) };
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.searchTracks = async (query) => {
			try {
				query = encodeURI(query);
				const data = await this.req(`/search?q=${query}&type=track&include_external=audio`, 'GET');

				if (data.tracks.items.length == 0) {
					return { status: false, message: 'Not Found' };
				}

				return { status: true, data: data.tracks };
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.searchAlbum = async (query) => {
			try {
				query = encodeURI(query);
				const data = await this.req(`/search?q=album:${query}&type=album&include_external=audio`, 'GET');

				if (data.albums.items.length == 0) {
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
				const data = await this.req(`/search?q=artist:${query}&type=artist&include_external=audio`, 'GET');

				if (data.artists.items.length == 0) {
					return { status: false, message: 'Not Found' };
				}

				return { status: true, data: data.artists };
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.getCurrentlyPlaying = async () => {
			try {
				await this.getAccessTokenFromRefreshToken();
				const { data } = await axios({
					url: `${this.#BASE_API}/me/player/currently-playing`,
					method: 'GET',
					headers: {
						Authorization: `Bearer ${this.#accessToken}`,
					},
				});

				return data !== '' ? data : null;
			} catch (err) {
				return { status: false, message: err.response.data.error.message };
			}
		};

		this.getDevices = async () => {
			try {
				await this.getAccessTokenFromRefreshToken();
				const { data } = await axios({
					url: `${this.#BASE_API}/me/player/devices`,
					method: 'GET',
					headers: {
						Authorization: `Bearer ${this.#accessToken}`,
					},
				});

				return data;
			} catch (err) {
				return { status: false, message: err.response?.data?.error?.message };
			}
		};

		this.getPlaybackState = async () => {
			try {
				await this.getAccessTokenFromRefreshToken();
				const { data } = await axios({
					url: `${this.#BASE_API}/me/player`,
					method: 'GET',
					headers: {
						Authorization: `Bearer ${this.#accessToken}`,
					},
				});

				return data;
			} catch (err) {
				return { status: false, message: err.response?.data?.error?.message };
			}
		};

		this.updateNowPlayingStates = async () => {
			try {
				await this.getAccessTokenFromRefreshToken();
				const { data } = await axios({
					url: `${this.#BASE_API}/me/player/currently-playing`,
					method: 'GET',
					headers: {
						Authorization: `Bearer ${this.#accessToken}`,
					},
				});

				if (!data) {
					return false;
				}

				if (data.currently_playing_type == 'ad') {
					return {
						trackTitle: 'Advertisement',
						artists: 'Spotify',
						progressMs: data.progress_ms,
						isPlaying: true,
					};
				}

				const { name: trackTitle, artists, duration_ms: durationMs } = data.item;

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
						.map((v, i) => (artists.length !== 1 && i + 1 == artists.length ? `and ${v}` : v))
						.join(', '),
					durationMs,
					progressMs,
					isPlaying,
				};
			} catch (err) {
				return { status: false, message: err.response?.data?.error?.message };
			}
		};

		this.skipPlayback = async () => {
			try {
				await this.getAccessTokenFromRefreshToken();
				const { data } = await axios({
					url: `${this.#BASE_API}/me/player/next`,
					method: 'POST',
					headers: {
						Authorization: `Bearer ${this.#accessToken}`,
					},
					params: {
						device_id: 'd9fe42af9e32ef6748395b0cf0479cc8642a5640' /* eslint-disable-line */,
					},
				});

				return data;
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.pausePlayback = async () => {
			try {
				await this.getAccessTokenFromRefreshToken();
				const { data } = await axios({
					url: `${this.#BASE_API}/me/player/pause`,
					method: 'PUT',
					headers: {
						Authorization: `Bearer ${this.#accessToken}`,
					},
					params: {
						device_id: 'd9fe42af9e32ef6748395b0cf0479cc8642a5640' /* eslint-disable-line */,
					},
				});

				return data;
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.resumePlayback = async () => {
			try {
				await this.getAccessTokenFromRefreshToken();
				const { data } = await axios({
					url: `${this.#BASE_API}/me/player/play`,
					method: 'PUT',
					headers: {
						Authorization: `Bearer ${this.#accessToken}`,
					},
					params: {
						device_id: 'd9fe42af9e32ef6748395b0cf0479cc8642a5640' /* eslint-disable-line */,
					},
				});

				return data;
			} catch (err) {
				return { status: false, message: err };
			}
		};

		this.startNewPlayback = async (trackId) => {
			try {
				await this.getAccessTokenFromRefreshToken();
				const { data } = await axios({
					url: `${this.#BASE_API}/me/player/play`,
					method: 'PUT',
					headers: {
						Authorization: `Bearer ${this.#accessToken}`,
					},
					params: {
						device_id: 'd9fe42af9e32ef6748395b0cf0479cc8642a5640' /* eslint-disable-line */,
						context_uri: `spotify:track:${trackId}` /* eslint-disable-line */,
						position_ms: 0 /* eslint-disable-line */,
					},
				});

				return data;
			} catch (err) {
				return { status: false, message: err };
			}
		};
	}
}

export const spotifier = new Spotifier();
