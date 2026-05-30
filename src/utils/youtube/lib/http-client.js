import axios from 'axios';
import { ErrUnexpectedStatusCode } from './errors.js';

const VisitorIdMaxAgeMs = 10 * 60 * 60 * 1000;

export class HttpClient {
	constructor(options = {}) {
		this.httpClient = options.httpClient || axios.create();
		this.client = options.client || null;
		this.consentID = '';
		this.visitorId = { value: '', updated: 0 };
	}

	async httpDo(config) {
		const isStream = config.responseType === 'stream';
		const headers = {
			'User-Agent': this.client.userAgent,
			Origin: 'https://youtube.com',
			'Sec-Fetch-Mode': 'navigate',
			...(config.headers || {})
		};

		if (!this.consentID) {
			this.consentID = String(Math.floor(Math.random() * 899) + 100);
		}

		headers.Cookie = `CONSENT=YES+cb.20210328-17-p0.en+FX+${this.consentID}`;

		const res = await this.httpClient.request({
			method: config.method || 'GET',
			url: config.url,
			data: config.data,
			headers,
			responseType: isStream ? 'stream' : 'text',
			transformResponse: isStream ? undefined : [(data) => data],
			maxRedirects: 5,
			validateStatus: () => true
		});

		if (res.status !== 200) {
			throw new ErrUnexpectedStatusCode(res.status);
		}

		return res;
	}

	async httpGet(url, config = {}) {
		return this.httpDo({ method: 'GET', url, ...config });
	}

	async httpGetBody(url) {
		const res = await this.httpGet(url);

		return res.data;
	}

	async httpPost(url, body) {
		const headers = {
			'X-Youtube-Client-Name': '3',
			'X-Youtube-Client-Version': this.client.version,
			'Content-Type': 'application/json',
			Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
		};
		const visitorId = await this.getVisitorId();

		if (visitorId) {
			headers['x-goog-visitor-id'] = visitorId;
		}

		return this.httpDo({ method: 'POST', url, data: JSON.stringify(body), headers });
	}

	async httpPostBody(url, body) {
		const res = await this.httpPost(url, body);

		return res.data;
	}

	async getVisitorId() {
		if (!this.visitorId.value || Date.now() - this.visitorId.updated > VisitorIdMaxAgeMs) {
			await this.refreshVisitorId();
		}

		return this.visitorId.value;
	}

	async refreshVisitorId() {
		try {
			const res = await this.httpDo({ method: 'GET', url: 'https://www.youtube.com' });
			const match = /"visitorData":"(.*?)"/.exec(res.data);

			if (match) {
				let value = JSON.parse(`"${match[1]}"`);

				try {
					value = decodeURIComponent(value);
				} catch {
					/* keep raw value when it is not percent-encoded */
				}
				this.visitorId.value = value;
				this.visitorId.updated = Date.now();
			}
		} catch {
			/* best-effort: a missing visitor id is non-fatal for most requests */
		}
	}
}
