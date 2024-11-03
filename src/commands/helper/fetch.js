import { fetch } from 'undici';
import parser from 'yargs-parser';
import _ from 'lodash';

import { isURL, extension } from '../../utils/index.js';

const isValidParser = (parser) =>
	/^(\["[^"]+"\]|\w+|\[(?!0+\d)\d+\])((\.\w+)|(:?\["[^"]+"\])|(?:\['[^']+'\])|\[(?!0+\d)\d+\])*$/g.test(parser);

const parseObject = (obj, str) => {
	try {
		if (!isValidParser(str)) {
			throw new Error('Invalid parser');
		}

		const value = _.get(obj, str);

		if (value === undefined) {
			const err = `(reading '${str}')`;

			throw new Error(`Cannot read properties of undefined.\n${err}\n${' '.repeat(err.length)}^^^^`);
		}

		return typeof value === 'object' || Array.isArray(value) ? JSON.stringify(value, null, 2) : value;
	} catch (error) {
		return {
			error: true,
			message: error.message
		};
	}
};

const fetchData = async (url, { method, headers, body }) => {
	const response = await fetch(url, {
		method,
		headers,
		body
	});

	if (!response.ok) {
		return { error: true, message: response.statusText };
	}

	return response;
};

const processJsonResponse = async (response, parser) => {
	let json = await response.json();

	if (parser) {
		json = parseObject(json, parser);

		if (!json || json.error) {
			return { error: true, message: json.message || 'Cannot parse json' };
		}
	} else {
		json = JSON.stringify(json, null, 2);
	}

	return json;
};

const processTextResponse = async (response, parser) => {
	let text = await response.text();

	try {
		const json = JSON.parse(text);

		if (parser) {
			text = parseObject(json, parser);

			if (!json || json.error) {
				return { error: true, message: json.message || 'Cannot parse json' };
			}
		} else {
			text = JSON.stringify(JSON.parse(json), null, 2);
		}
	} catch {
		// do nothing
	}

	console.log(text);

	return text;
};

const processBinaryResponse = async (response) => {
	const buffer = await response.arrayBuffer();

	return buffer;
};

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'fetch',
	minifiedDescription: 'HTTP Requests',
	description: 'Do a HTTP request and send the results.',
	usage: '!fetch',
	aliases: ['get'],
	category: 'Helper',
	cooldown: 10,
	limit: 3,
	status: 'enable',
	async run({ from, message, query }, client) {
		if (!query) {
			return await client.instance.reply('Fetch expect <url> <?parser>', { from, quoted: message });
		}

		let {
			_: queries,
			method,
			headers,
			body,
			parser: queryParser
		} = parser(query, {
			alias: {
				method: ['X'],
				headers: ['H'],
				body: ['d'],
				'content-type': ['T'],
				parser: ['p']
			},
			configuration: {
				'short-option-groups': false,
				'strip-aliased': true
			}
		});

		const url = queries.find((v) => isURL(v));

		if (!url) {
			return await client.instance.reply('Fetch expect <url>', { from, quoted: message });
		}

		method = method || 'GET';
		method = Array.isArray(method) ? method[0] : method;

		headers = headers
			? headers.reduce((acc, cur) => {
					const [key, value] = cur.split(':');

					return {
						...acc,
						[key]: value
					};
			  }, {}) // eslint-disable-line
			: {};

		if (method === 'GET') {
			body = undefined;
		}

		if (body) {
			headers['content-type'] = 'application/json;charset=UTF-8';
		}

		try {
			const response = await fetchData(url, { method, headers, body });

			if (response.error) {
				return client.instance.reply(response.message, { from, quoted: message });
			}

			const responseTypes = response.headers.get('content-type').split(';')[0];

			if (responseTypes === 'application/json') {
				const data = await processJsonResponse(response, queryParser);

				if (data.error) {
					return await client.instance.reply(data.message, { from, quoted: message });
				}

				await client.instance.reply(data, { from, quoted: message });
			} else if (responseTypes.startsWith('text')) {
				const data = await processTextResponse(response, queryParser);

				await client.instance.reply(data, { from, quoted: message });
			} else {
				const disposition = response.headers['content-disposition'];

				if (disposition && disposition.includes('attachment')) {
					const data = await processBinaryResponse(response);

					const mime = responseTypes.split('/')[1];
					const messageTypes = mime === 'audio' || mime === 'application' ? 'document' : mime;
					const fileName = messageTypes === 'document' ? `file_fetched.${extension(responseTypes)}` : undefined;

					await client.instance.send(from, {
						[messageTypes]: Buffer.from(data),
						...(fileName ? { fileName, mime: responseTypes } : {})
					});
				} else {
					await client.instance.reply('Unhandled Content-Type : ' + response.headers['content-type'], {
						from,
						quoted: message
					});
					console.log('Unhandled Content-Type:', response.headers['content-type']);
				}
			}
		} catch (error) {
			console.log(error);
			await client.instance.reply(error.message, { from, quoted: message });
		}
	}
};
