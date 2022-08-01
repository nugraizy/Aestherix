import Axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const log = console.log;

class Spotifier {
	#clientId = process.env.CLIENT_ID;
	#clientSecret = process.env.CLIENT_SECRET;
	#accessToken = process.env.ACCESS_TOKEN;
	#refreshToken = process.env.REFRESH_TOKEN;
	#token = `Basic ${new Buffer.from(`${this.#clientId}:${this.#clientSecret}`).toString("base64")}`;
	#bearerToken = null;
	#currentlyPlaying = null;
	#BASE_API = "https://api.spotify.com/v1";
	#BASE_API_AUTH = "https://accounts.spotify.com/api/token";
	constructor() {
		if (this.#clientId == undefined || this.#clientSecret == undefined) throw new Error("Please add CLIENT_ID and CLIENT_SECRET to your .env files");
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
					...opts,
					Authorization: `Bearer ${this.#bearerToken}`,
				},
			});
			return { status: true, ...data };
		} catch (err) {
			log(err.response.data);
			return { status: false, message: err.message };
		}
	}

	updateCredential(clientId, clientSecret) {
		if (!clientId) return { status: false, message: "Parameter clientId must provided" };
		if (!clientSecret) return { status: false, message: "Parameter clientSecret must provided" };
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

	async getPlaylists(playlistsID) {
		try {
			if (!playlistsID) return { status: false, message: "Parameter playlistsID must provided" };
			return { status: true, ...(await this.req(`/playlists/${playlistsID}`, "GET")), ...this };
		} catch (err) {
			return { status: false, message: err };
		}
	}

	async getAlbum(albumID) {
		try {
			if (!albumID) return { status: false, message: "Parameter albumID must provided" };
			return { status: true, ...(await this.req(`/albums?ids=${albumID}`, "GET")) };
		} catch (err) {
			return { status: false, message: err };
		}
	}

	async getAlbumTracks(albumID) {
		try {
			if (!albumID) return { status: false, message: "Parameter albumID must provided" };
			return { status: true, ...(await this.req(`/albums/${albumID}/tracks`, "GET")) };
		} catch (err) {
			return { status: false, message: err };
		}
	}

	async getArtists(artistsID) {
		try {
			if (!artistsID) return { status: false, message: "Parameter artistsID must provided" };
			return { status: true, ...(await this.req(`/artists?ids=${artistsID}`, "GET")) };
		} catch (err) {
			return { status: false, message: err };
		}
	}

	async getArtistsAlbums(artistsID) {
		try {
			if (!artistsID) return { status: false, message: "Parameter artistsID must provided" };
			return { status: true, ...(await this.req(`/artists?ids=${artistsID}/albums`, "GET")) };
		} catch (err) {
			return { status: false, message: err };
		}
	}

	async getArtistsTopTracks(artistsID) {
		try {
			if (!artistsID) return { status: false, message: "Parameter artistsID must provided" };
			return { status: true, ...(await this.req(`/artists?ids=${artistsID}/top-tracks`, "GET")) };
		} catch (err) {
			return { status: false, message: err };
		}
	}

	async getTracks(tracksID) {
		try {
			if (!tracksID) return { status: false, message: "Parameter tracksID must provided" };
			return { status: true, ...(await this.req(`/tracks?ids=${tracksID}`, "GET")) };
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
			method: "post",
			params,
		});
		this.#accessToken = access_token;
		return { status: true, message: "Success getting access token" };
	}

	async getCurrentlyPlaying() {
		try {
			await this.getAccessTokenFromRefreshToken();
			const { data } = await Axios({
				url: this.#BASE_API + `/me/player/currently-playing`,
				method: "GET",
				headers: {
					Authorization: `Bearer ${this.#accessToken}`,
				},
			});
			return data;
		} catch (err) {
			return { status: false, message: err };
		}
	}
}

export const spotifier = new Spotifier();
