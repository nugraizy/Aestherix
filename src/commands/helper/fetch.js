import { fileTypeFromBuffer } from 'file-type';
import fs from 'fs-extra';
import _ from 'lodash';
import { fetch } from 'undici';
import parser from 'yargs-parser';

import { extension, gif2mp4, isURL } from '../../utils/index.js';

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
	usage:
		'!fetch\nUsage :\n!fetch `www.example.com` -X `POST/GET` -H `"key1: value1"` -H `"ke2: value2"` -d `"{...JSONObjects}"` -T "conte"',
	aliases: ['get'],
	category: 'Helper',
	cooldown: 10,
	limit: 3,
	status: 'enable',
	async run({ from, message, query }, client) {
		if (!query) {
			return await client.reply(from, 'Fetch expect <url> <?parser>', message);
		}

		let {
			_: queries,
			method,
			headers,
			body,
			parser: queryParser,
			media,
			contentType
		} = parser(query, {
			alias: {
				method: ['X'],
				headers: ['H'],
				body: ['d'],
				contentType: ['T'],
				parser: ['p'],
				media: ['m']
			},
			boolean: ['media'],
			configuration: {
				'short-option-groups': false,
				'strip-aliased': true
			}
		});

		const url = queries.find((v) => isURL(v));

		if (!url) {
			return await client.reply(from, 'Fetch expect <url>', message);
		}

		if (method && !/^(GET|POST)$/i.test(method)) {
			return await client.reply(from, 'Method must be `GET` or `POST` (case-insensitive).', message);
		}

		if (body && /^GET$/i.test(method)) {
			return await client.reply(from, '`GET` method cannot accept body.', message);
		}

		if (body && /^POST$/i.test(method)) {
			try {
				JSON.parse(body);
			} catch {
				return await client.reply(from, '`body` MUST be a valid JSON string.', message);
			}
		}

		if (contentType && !/^[a-z0-9!#$&^_-]+\/[a-z0-9!#$&^_.+-]+$/i.test(contentType)) {
			return await client.reply(from, `Invalid content-type: "${contentType}"`, message);
		}

		method = method || 'GET';
		method = Array.isArray(method) ? method[0] : method;

		headers = headers ? (Array.isArray(headers) ? headers : [headers]) : null;
		headers = headers
			? headers.reduce((acc, cur) => {
					if (!/^[^:\s]+:\s?.+$/.test(cur)) {
						client.reply(from, `Invalid header format: "${cur}" (expected "key: value")`, message);
						return acc;
					}

					const [key, ...rest] = cur.split(':');

					const value = rest.join(':').trim();

					if (key.toLowerCase() === 'content-type' && !/^[a-z0-9!#$&^_-]+\/[a-z0-9!#$&^_.+-]+$/i.test(value)) {
						client.reply(from, `Invalid content-type: "${contentType}"`, message);
						return acc;
					}

					return {
						...acc,
						[key.trim()]: value
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
				return client.reply(from, response.message, message);
			}

			const responseTypes = response.headers.get('content-type').split(';')[0];

			if (responseTypes === 'application/json') {
				const data = await processJsonResponse(response, queryParser);

				if (data.error) {
					return await client.reply(from, data.message, message);
				}

				if (media && typeof data === 'string' && isURL(data)) {
					const response = await fetch(data);
					let fileBuffer = Buffer.from(await response.arrayBuffer());
					const { mime, ext } = await fileTypeFromBuffer(fileBuffer);

					const isGif = mime.includes('gif');
					const messageType = isGif || mime.includes('video') ? 'video' : mime.includes('image') ? 'image' : 'document';

					if (isGif) {
						const id = Date.now();
						const filepath = (u) => `./src/media/temporary_files/${u}`;

						const inputPath = filepath(`input-${id}.gif`);
						const outputPath = filepath(`output-${id}.mp4`);

						fs.writeFileSync(inputPath, fileBuffer);

						const { output } = await gif2mp4(inputPath, outputPath);

						fileBuffer = await fs.readFile(output);

						await client.send(
							from,
							{
								[messageType]: fileBuffer,
								gifPlayback: true
							},
							{ quoted: message }
						);

						fs.unlinkSync(inputPath);
						fs.unlinkSync(outputPath);

						return;
					}

					await client.send(
						from,
						{
							[messageType]: fileBuffer,
							...(messageType === 'document' ? { fileName: `file.${ext}` } : {})
						},
						{ quoted: message }
					);
					return;
				}

				await client.reply(from, data, message);
			} else if (responseTypes.startsWith('text')) {
				const data = await processTextResponse(response, queryParser);

				await client.reply(from, data, message);
			} else {
				const data = await processBinaryResponse(response);

				const mime = responseTypes.split('/')[0];
				const messageTypes = mime === 'audio' || mime === 'application' ? 'document' : mime;
				const fileName = messageTypes === 'document' ? `file_fetched.${extension(responseTypes)}` : undefined;

				await client.send(from, {
					[messageTypes]: Buffer.from(data),
					...(fileName ? { fileName, mime: responseTypes } : {})
				});
			}
		} catch (error) {
			console.log(error);
			await client.reply(from, error.message, message);
		}
	}
};
