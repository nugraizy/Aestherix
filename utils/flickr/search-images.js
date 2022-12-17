import Flickr from 'flickr-sdk';
import dotenv from 'dotenv';

dotenv.config();

const _key = process.env.FLICKR_KEY;

export class FlickerAPI extends Flickr {
	#_api;
	constructor() {
		const API = super(_key);

		this.#_api = API;

		this.searchImages = async (keyword) =>
			new Promise(async (resolve, reject) => {
				let { photos } = await this.req('photos', 'search', { text: keyword });

				if (photos.photo.length == 0) {
					reject(new Error('Image Not Found'));
				}

				resolve((await Promise.all(photos.photo.map((v) => this.detailImage(v.id)))).filter((v) => v.originalSecret));
			});

		this.detailImage = async (id) =>
			new Promise(async (resolve, reject) => {
				try {
					let { photo } = await this.req('photos', 'getInfo', { photo_id: Number(id) }); /* eslint-disable-line */

					resolve({
						id: photo.id,
						originalSecret: photo.originalsecret,
						userName: photo.owner.username,
						fullName: photo.owner.realname,
						title: photo.title._content,
						description: photo.description._content.split('\n')[0],
						views: photo.views,
						tags: photo.tags.tag.map((v) => v.raw).join(', '),
						posted: photo.dates.taken,
						source: photo.urls.url[0]._content,
						download: this.urlDownload(photo.id, photo.server, photo.originalsecret, photo.originalformat),
					});
				} catch (err) {
					reject(err);
				}
			});
	}
	async req(type, method, options) {
		let { text } = await this.#_api[type][method](options);

		return JSON.parse(text);
	}

	urlDownload(id, server, secret, mime) {
		return `https://live.staticflickr.com/${server}/${id}_${secret}_o_d.${mime}`;
	}
}
