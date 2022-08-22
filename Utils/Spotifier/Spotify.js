import Axios from "axios";
import dotenv from "dotenv";
dotenv.config();

class Spotifier {
	#clientId = process.env.SPOTIFY_CLIENT_ID;
	#clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
	#accessToken = process.env.SPOTIFY_ACCESS_TOKEN;
	#refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
	#token = `Basic ${new Buffer.from(`${this.#clientId}:${this.#clientSecret}`).toString("base64")}`;
	#bearerToken = null;
	#currentlyPlaying = null;
	#BASE_API = "https://api.spotify.com/v1";
	#BASE_API_AUTH = "https://accounts.spotify.com/api/token";
	constructor() {
		if (!(this.#clientId || this.#clientSecret)) {
			throw new Error("Please add CLIENT_ID and CLIENT_SECRET to your .env files");
		}
	}

	tokenize() {
		return {
			url: this.#BASE_API_AUTH,
			method: "POST",
			headers: {
				Authorization: this.#token,
			},
			data: "grant_type=client_credentials",
		};
	}

	async req(path, method, opts) {
		try {
			if (this.#bearerToken == null) {
				await this.refreshToken();
			}
			const { data } = await Axios({
				url: this.#BASE_API + path,
				method,
				headers: {
					...(opts !== undefined && "headers" in opts ? opts.headers : {}),
					Authorization: `Bearer ${this.#bearerToken}`,
				},
				...(opts !== undefined && "data" in opts ? { data: opts } : {}),
			});
			return { status: true, ...data };
		} catch (err) {
			log(err.response);
			return { status: false, message: err.message };
		}
	}

	updateCredential(clientId, clientSecret) {
		if (!clientId) {
			return { status: false, message: "Parameter clientId must provided" };
		}
		if (!clientSecret) {
			return { status: false, message: "Parameter clientSecret must provided" };
		}
		this.#clientId = clientId;
		this.#clientSecret = clientSecret;
		return { status: true, message: "Credential Updated" };
	}

	async refreshToken() {
		try {
			const { data } = await Axios(this.tokenize());
			this.#bearerToken = data.access_token;
			return { status: true, message: "Success to refresh token" };
		} catch (err) {
			return { status: false, message: err.message };
		}
	}

	async getAccessTokenFromRefreshToken() {
		const params = new URLSearchParams();
		params.append("client_id", this.#clientId);
		params.append("client_secret", this.#clientSecret);
		params.append("grant_type", "refresh_token");
		params.append("refresh_token", this.#refreshToken);
		const {
			data: { access_token },
		} = await Axios({
			url: "https://accounts.spotify.com/api/token",
			method: "POST",
			params,
		});
		this.#accessToken = access_token;
		return { status: true, message: "Success getting access token" };
	}

	async getPlaylists(playlistsID) {
		try {
			if (!playlistsID) {
				return { status: false, message: "Parameter playlistsID must provided" };
			}
			return { status: true, ...(await this.req(`/playlists/${playlistsID}`, "GET")), ...this };
		} catch (err) {
			return { status: false, message: err };
		}
	}

	async getAlbum(albumID) {
		try {
			if (!albumID) {
				return { status: false, message: "Parameter albumID must provided" };
			}
			return { status: true, ...(await this.req(`/albums?ids=${albumID}`, "GET")) };
		} catch (err) {
			return { status: false, message: err };
		}
	}

	async getAlbumTracks(albumID) {
		try {
			if (!albumID) {
				return { status: false, message: "Parameter albumID must provided" };
			}
			return { status: true, ...(await this.req(`/albums/${albumID}/tracks`, "GET")) };
		} catch (err) {
			return { status: false, message: err };
		}
	}

	async getArtists(artistsID) {
		try {
			if (!artistsID) {
				return { status: false, message: "Parameter artistsID must provided" };
			}
			return { status: true, ...(await this.req(`/artists?ids=${artistsID}`, "GET")) };
		} catch (err) {
			return { status: false, message: err };
		}
	}

	async getArtistsAlbums(artistsID) {
		try {
			if (!artistsID) {
				return { status: false, message: "Parameter artistsID must provided" };
			}
			return { status: true, ...(await this.req(`/artists?ids=${artistsID}/albums`, "GET")) };
		} catch (err) {
			return { status: false, message: err };
		}
	}

	async getArtistsTopTracks(artistsID) {
		try {
			if (!artistsID) {
				return { status: false, message: "Parameter artistsID must provided" };
			}
			return { status: true, ...(await this.req(`/artists?ids=${artistsID}/top-tracks`, "GET")) };
		} catch (err) {
			return { status: false, message: err };
		}
	}

	async getTracks(tracksID) {
		try {
			if (!tracksID) {
				return { status: false, message: "Parameter tracksID must provided" };
			}
			return { status: true, ...(await this.req(`/tracks?ids=${tracksID}`, "GET")) };
		} catch (err) {
			return { status: false, message: err };
		}
	}

	async getTracksAudioAnalysis(tracksID) {
		try {
			if (!tracksID) {
				return { status: false, message: "Parameter tracksID must provided" };
			}
			return { status: true, ...(await this.req(`/audio-analysis/${tracksID}`, "GET")) };
		} catch (err) {
			return { status: false, message: err };
		}
	}

	async getTracksAudioFeatures(tracksID) {
		try {
			if (!tracksID) {
				return { status: false, message: "Parameter tracksID must provided" };
			}
			return { status: true, ...(await this.req(`/audio-features?ids=${tracksID}`, "GET")) };
		} catch (err) {
			return { status: false, message: err };
		}
	}

	async getNewReleases() {
		try {
			return { status: true, ...(await this.req(`/browse/new-releases`, "GET")) };
		} catch (err) {
			return { status: false, message: err };
		}
	}

	async searchTracks(query, artists) {
		try {
			query = encodeURI(query);
			const data = await this.req(`/search?q=track:${query}+artist:${artists}&type=track&include_external=audio`, "GET");
			if (data.tracks.items.length == 0) {
				return { status: false, message: "Not Found" };
			}
			return { status: true, data: data.tracks };
		} catch (err) {
			return { status: false, message: err };
		}
	}

	async searchAlbum(query) {
		try {
			query = encodeURI(query);
			const data = await this.req(`/search?q=album:${query}&type=album&include_external=audio`, "GET");
			if (data.albums.items.length == 0) {
				return { status: false, message: "Not Found" };
			}
			return { status: true, data: data.albums };
		} catch (err) {
			return { status: false, message: err };
		}
	}

	async searchArtist(query) {
		try {
			query = encodeURI(query);
			const data = await this.req(`/search?q=artist:${query}&type=artist&include_external=audio`, "GET");
			if (data.artists.items.length == 0) {
				return { status: false, message: "Not Found" };
			}
			return { status: true, data: data.artists };
		} catch (err) {
			return { status: false, message: err };
		}
	}

	async getCurrentlyPlaying() {
		try {
			await this.getAccessTokenFromRefreshToken();
			const { data } = await Axios({
				url: `${this.#BASE_API}/me/player/currently-playing`,
				method: "GET",
				headers: {
					Authorization: `Bearer ${this.#accessToken}`,
				},
			});
			return data !== "" ? data : null;
		} catch (err) {
			return { status: false, message: err.response.data.error.message };
		}
	}

	async getDevices() {
		try {
			await this.getAccessTokenFromRefreshToken();
			const { data } = await Axios({
				url: `${this.#BASE_API}/me/player/devices`,
				method: "GET",
				headers: {
					Authorization: `Bearer ${this.#accessToken}`,
				},
			});
			return data;
		} catch (err) {
			return { status: false, message: err.response?.data?.error?.message };
		}
	}

	async getPlaybackState() {
		try {
			await this.getAccessTokenFromRefreshToken();
			const { data } = await Axios({
				url: `${this.#BASE_API}/me/player`,
				method: "GET",
				headers: {
					Authorization: `Bearer ${this.#accessToken}`,
				},
			});
			return data;
		} catch (err) {
			return { status: false, message: err.response?.data?.error?.message };
		}
	}

	async updateNowPlayingStates() {
		try {
			await this.getAccessTokenFromRefreshToken();
			const { data } = await Axios({
				url: `${this.#BASE_API}/me/player/currently-playing`,
				method: "GET",
				headers: {
					Authorization: `Bearer ${this.#accessToken}`,
				},
			});
			if (!data) {
				return false;
			}
			if (data.currently_playing_type == "ad")
				return {
					trackTitle: "Advertisement",
					artists: "Spotify",
					progress_ms: data.progress_ms,
					is_playing: true,
				};
			const { name: trackTitle, artists, duration_ms } = data.item;
			this.#currentlyPlaying = data.item.name;
			if (!this.#currentlyPlaying) {
				return false;
			}
			const { progress_ms, is_playing } = data;
			return {
				trackTitle,
				artists: artists
					.slice(0, 3)
					.map((v) => v.name)
					.map((v, i) => (artists.length !== 1 && i + 1 == artists.length ? `and ${v}` : v))
					.join(", "),
				duration_ms,
				progress_ms,
				is_playing,
			};
		} catch (err) {
			return { status: false, message: err.response?.data?.error?.message };
		}
	}

	async skipPlayback() {
		try {
			await this.getAccessTokenFromRefreshToken();
			const { data } = await Axios({
				url: `${this.#BASE_API}/me/player/next`,
				method: "POST",
				headers: {
					Authorization: `Bearer ${this.#accessToken}`,
				},
				params: {
					device_id: "d9fe42af9e32ef6748395b0cf0479cc8642a5640",
				},
			});
			return data;
		} catch (err) {
			return { status: false, message: err };
		}
	}

	async pausePlayback() {
		try {
			await this.getAccessTokenFromRefreshToken();
			const { data } = await Axios({
				url: `${this.#BASE_API}/me/player/pause`,
				method: "PUT",
				headers: {
					Authorization: `Bearer ${this.#accessToken}`,
				},
				params: {
					device_id: "d9fe42af9e32ef6748395b0cf0479cc8642a5640",
				},
			});
			return data;
		} catch (err) {
			return { status: false, message: err };
		}
	}

	async resumePlayback() {
		try {
			await this.getAccessTokenFromRefreshToken();
			const { data } = await Axios({
				url: `${this.#BASE_API}/me/player/play`,
				method: "PUT",
				headers: {
					Authorization: `Bearer ${this.#accessToken}`,
				},
				params: {
					device_id: "d9fe42af9e32ef6748395b0cf0479cc8642a5640",
				},
			});
			return data;
		} catch (err) {
			return { status: false, message: err };
		}
	}

	async startNewPlayback(trackId) {
		try {
			await this.getAccessTokenFromRefreshToken();
			const { data } = await Axios({
				url: `${this.#BASE_API}/me/player/play`,
				method: "PUT",
				headers: {
					Authorization: `Bearer ${this.#accessToken}`,
				},
				params: {
					device_id: "d9fe42af9e32ef6748395b0cf0479cc8642a5640",
					context_uri: `spotify:track:${trackId}`,
					position_ms: 0,
				},
			});
			return data;
		} catch (err) {
			return { status: false, message: err };
		}
	}
}

export const spotifier = new Spotifier();
