/* global log */
import dotenv from 'dotenv';
import { fileTypeFromBuffer } from 'file-type';
import fs from 'fs';
import { IgApiClient } from 'instagram-private-api';
import { GraphQLSubscriptions, SkywalkerSubscriptions, withFbns, withRealtime } from 'instagram_mqtt';
import sharp from 'sharp';

import configuration from '../../connect.js';

dotenv.config();

const IMAGE_MIMETYPE = JSON.parse(fs.readFileSync('./databases/mimetypes/Image.json'));

class Instafier {
	#username = process.env.INSTAGRAM_USERNAME;
	#password = process.env.INSTAGRAM_PASSWORD;
	#authorId = null;
	constructor() {
		if (!configuration.OPTIONS.instaNotifier) {
			return;
		}

		if (!(this.#username || this.#password)) {
			throw new Error('Username and password are required');
		}

		this.Container = new Map();
		this.Instagram = withFbns(withRealtime(new IgApiClient()));
		this.Instagram.state.generateDevice(process.env.INSTAGRAM_USERNAME);
	}

	async login() {
		try {
			await this.Instagram.account.login(this.#username, this.#password);
			return { error: false };
		} catch {
			return { error: true, message: 'Login Failed' };
		}
	}

	async connect() {
		try {
			return {
				error: false,
				...(await this.Instagram.fbns.connect()),
				...(await this.Instagram.realtime.connect({
					graphQlSubs: [
						GraphQLSubscriptions.getAppPresenceSubscription(),
						GraphQLSubscriptions.getClientConfigUpdateSubscription(),
						GraphQLSubscriptions.getZeroProvisionSubscription(this.Instagram.state.phoneId),
						GraphQLSubscriptions.getDirectStatusSubscription(),
						GraphQLSubscriptions.getDirectTypingSubscription(this.Instagram.state.cookieUserId),
						GraphQLSubscriptions.getAsyncAdSubscription(this.Instagram.state.cookieUserId),
					],
					skywalkerSubs: [SkywalkerSubscriptions.directSub(this.Instagram.state.cookieUserId), SkywalkerSubscriptions.liveSub(this.Instagram.state.cookieUserId)],
					irisData: await this.Instagram.feed.directInbox().request(),
				})),
			};
		} catch {
			return { error: true, message: 'Failed to connect' };
		}
	}

	closeConnection() {
		try {
			this.Instagram.realtime.removeAllListeners();
			this.Instagram.fbns.removeAllListeners();
			return { error: false, message: 'Connection successfully closed' };
		} catch (err) {
			return { error: false, message: err.message };
		}
	}

	async saveState() {
		if (!fs.existsSync('./session/instagram_auth/')) {
			fs.mkdirSync('./session/instagram_auth/');
		}

		return fs.writeFileSync(`./session/instagram_auth/${process.env.INSTAGRAM_USERNAME}.json`, await this.Instagram.exportState(), { encoding: 'utf8' });
	}

	async readState() {
		if (!fs.existsSync(`./session/instagram_auth/${process.env.INSTAGRAM_USERNAME}.json`)) {
			await this.login();
			await this.saveState();
		} else {
			await this.Instagram.importState(fs.readFileSync(`./session/instagram_auth/${process.env.INSTAGRAM_USERNAME}.json`, { encoding: 'utf8' }));
		}

		this.#authorId = (await this.Instagram.account.currentUser()).pk;
		return { error: false, message: 'State read' };
	}

	async changeBiography(texts) {
		try {
			if (!texts) {
				return { error: true, message: 'No texts provided' };
			}

			return { error: false, ...(await this.Instagram.account.setBiography(texts)) };
		} catch {
			return { error: true, message: 'Failed to change biography' };
		}
	}

	async searchUser(username) {
		try {
			return { error: false, ...(await this.Instagram.search.users(username)) };
		} catch {
			return { error: true, message: 'Failed to search user' };
		}
	}

	async postStory(buffer) {
		try {
			const fileType = fileTypeFromBuffer(buffer);

			if (!fileType) {
				return { error: true, message: 'No file type detected' };
			}

			if (IMAGE_MIMETYPE.includes(fileType.mime)) {
				const image = sharp(buffer).jpeg({ quality: 100 });

				buffer = await image.toBuffer();
			} else {
				return { error: true, message: 'File type not supported' };
			}

			return await this.Instagram.publish.story({ file: buffer });
		} catch {
			return { error: true, message: 'Failed to post story' };
		}
	}

	async _parseIncomingMessage(message) {
		const data = {};

		data.op = message.op;
		data.path = message.path;
		data.itemId = message.item_id;
		data.userId = message.user_id;
		data.isOwner = data.userId == this.#authorId;
		data.timestamp = message.timestamp;
		data.type = message.item_type == 'link' ? 'texts' : message.item_type == 'animated_media' ? 'animated_media' : message.item_type;

		if ('text' in message) {
			data.content = message.text;
		}

		if (message.item_type == 'link') {
			data.content = message.link.text;
		}

		if (data.type == 'media' && 'video_versions' in message.media) {
			data.content = message.media.video_versions[0].url;
			data.videoMetaData = {
				id: message.media.id,
				duration: message.media.video_duration,
				width: message.media.video_versions[0].width,
				height: message.media.video_versions[0].height,
			};
		}

		if (data.type == 'media' && 'image_versions2' in message.media) {
			data.content = message.media.image_versions2.candidates[0].url;
			data.imageMetaData = {
				id: message.media.id,
				width: message.media.image_versions2.candidates[0].width,
				height: message.media.image_versions2.candidates[0].height,
			};
		}

		if (data.type == 'voice_media') {
			data.content = message.voice_media.media.audio.audio_src;
			data.voiceMetaData = {
				id: message.voice_media.media.id,
				duration: message.voice_media.media.audio.duration,
			};
		}

		if (data.type == 'animated_media') {
			data.content = message.animated_media.images.fixed_height.webp;
			data.animatedMetaData = {
				id: message.animated_media.id,
				webpSize: message.animated_media.images.fixed_height.webp_size,
				width: message.animated_media.images.fixed_height.width,
				height: message.animated_media.images.fixed_height.height,
				isRandom: message.animated_media.is_random,
				isSticker: message.animated_media.is_sticker,
				madeBy: message.animated_media.user.username,
			};
		}

		data.user = await this.Instagram.user.info(data.userId);

		if (!this.Container.has(data.userId)) {
			this.Container.set(data.userId, new Map());
			this.Container.get(data.userId).set(data.itemId, data);
		} else if (this.Container.get(data.userId).has(data.itemId)) {
			return;
		} else {
			this.Container.get(data.userId).set(data.itemId, data);
		}

		return data;
	}

	async ev() {
		await this.readState();
		this.Instagram.realtime.on('message', async (data) => {
			if (data.message.op == 'add') {
				data = await this._parseIncomingMessage(data.message);
				this.Instagram.realtime.emit('onMessage', { model: 'received', ...data });
			}
		});

		this.Instagram.realtime.on('realtimeSub', (message) => {
			log('[EVENT REALTIME REALTIMESUB]', JSON.stringify(message));
		});

		this.Instagram.realtime.on('receive', (data) => {
			log('[EVENT REALTIME RECEIVE]', JSON.stringify(data));
		});

		this.Instagram.realtime.on('error', (e) => log('REALTIME Error :', e));

		this.Instagram.realtime.on('close', (d) => log('REALTIME Disconnected :', d));

		this.Instagram.fbns.on('push', (message) => {
			if (message.collapseKey == 'direct_v2_delete_item' && this.Container.has(Number(message.sourceUserId))) {
				this.Instagram.fbns.emit('onDeleted', { model: 'deleted', ...this.Container.get(Number(message.sourceUserId)).get(message.actionParams.dx) });
			}
			//message = await instafier._parseIncomingNotification(message);
		});

		this.Instagram.fbns.on('error', (e) => log('FBNS Error :', e));

		this.Instagram.fbns.on('warning', (w) => log('FBNS Warning :', w));

		this.Instagram.fbns.on('disconnect', (d) => log('FBNS Disconnected :', d));

		await this.connect().then(() => (!configuration.OPTIONS.noLoad ? log('Instagram Service Connected') : {}));
		return this.Instagram;
	}
}

export const instafier = new Instafier();
