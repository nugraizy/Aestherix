import { Utils } from './utils.js';

export const Clients = {
	Web: {
		name: 'WEB',
		version: '2.20220801.00.00',
		key: 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8',
		userAgent:
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
		androidVersion: 0,
		deviceModel: ''
	},
	Android: {
		name: 'ANDROID',
		version: '20.10.38',
		key: 'AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w',
		userAgent: 'com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip',
		androidVersion: 0,
		deviceModel: ''
	},
	IOS: {
		name: 'IOS',
		version: '19.45.4',
		key: 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8',
		userAgent: 'com.google.ios.youtube/19.45.4 (iPhone16,2; U; CPU iOS 18_1_0 like Mac OS X;)',
		androidVersion: 0,
		deviceModel: 'iPhone16,2'
	},
	Embedded: {
		name: 'WEB_EMBEDDED_PLAYER',
		version: '1.19700101',
		key: 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8',
		userAgent:
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
		androidVersion: 0,
		deviceModel: ''
	},
	AndroidVR: {
		name: 'ANDROID_VR',
		version: '1.65.10',
		key: '',
		userAgent:
			'com.google.android.apps.youtube.vr.oculus/1.65.10 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip',
		androidVersion: 0,
		deviceModel: ''
	}
};

export const DefaultClient = Clients.AndroidVR;

const playerParams = 'CgIQBg==';

export function prepareInnertubeContext(clientInfo) {
	return {
		client: {
			hl: 'en',
			gl: 'US',
			timeZone: 'UTC',
			deviceModel: clientInfo.deviceModel || undefined,
			clientName: clientInfo.name,
			clientVersion: clientInfo.version,
			androidSDKVersion: clientInfo.androidVersion || undefined,
			userAgent: clientInfo.userAgent || undefined,
			visitorData: Utils.randomVisitorData('US')
		}
	};
}

export function prepareInnertubePlaylistData(id, continuation, clientInfo) {
	const context = prepareInnertubeContext(clientInfo);

	if (continuation) {
		return {
			context,
			continuation: id,
			contentCheckOk: true,
			racyCheckOk: true,
			params: playerParams
		};
	}

	return {
		context,
		browseId: `VL${id}`,
		contentCheckOk: true,
		racyCheckOk: true,
		params: playerParams
	};
}
