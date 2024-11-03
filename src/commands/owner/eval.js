import * as _ from 'baileys'; /* eslint-disable-line */
import { WAProto } from 'baileys'; /* eslint-disable-line */
import { exec } from 'child_process';
import fs from 'fs';
import fsX from 'fs-extra'; /* eslint-disable-line */
import prettier from 'js-beautify';
import syntaxerror from 'syntax-error';
import * as util from 'util'; /* eslint-disable-line */
import { format } from 'util';

import configuration from '../../helper/config/connect.js';
import * as a from '../../helper/index.js';
import * as b from '../../utils/index.js';
import * as c from '../../helper/config/connect.js';
import * as d from '../../index.js';

const func = { ...a, ...b, ...c, ...d, ...configuration }; /* eslint-disable-line */
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const col = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;

class CustomArray extends Array {
	constructor(...args) {
		return typeof args[0] === 'number' ? super(Math.min(args[0], 10_000)) : super(...args);
	}
}

const print = ({ from, quoted }, ...args) => client.instance.reply(format(...args), { from, quoted });

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'eval',
	minifiedDescription: 'Evaluate Code',
	description: 'Evaluates code.',
	usage: '!eval <code>',
	aliases: ['/>', '$>', '=>', '!>'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run(message, client, store) {
		let {
			/* eslint-disable */
			isFromMe,
			from,
			isGroup,
			isBaileys,
			sender,
			prettyNumber,
			timeStamp,
			filename,
			groupMetadata,
			groupName,
			groupId,
			isGroupOwner,
			pushname,
			botNumber,
			ownerNumbers,
			isOwner,
			settings,
			type,
			typeQuoted,
			isAdmin,
			rawParticipants,
			adminGroups,
			participantsGroup,
			ownerGroups,
			isBotAdmin,
			body,
			args,
			cmd,
			isCmd,
			prefix,
			query,
			isMedia,
			isQuotedImage,
			isQuotedVideo,
			isQuotedAudio,
			isQuotedContact,
			isQuotedContactsArray,
			isQuotedDocument,
			isQuotedLiveLocation,
			isQuotedLocation,
			isQuotedSticker,
			isMediaVid,
			isMediaImage,
			isMediaDocument,
			isLocation,
			isLiveLocation,
			isSticker,
			isAudio,
			isContact,
			isContactsArray,
			isDocument,
			isViewOnce,
			isViewOnceImage,
			isViewOnceVideo,
			isQuotedViewOnce,
			isQuotedViewOnceImage,
			isQuotedViewOnceVideo,
			typeViewOnce,
			typeSticker,
			stickerAble,
			waitForInput,
			groupSettings,
			isDisappearingChat,
			mention,
			mediaData,
			extractMediaData,
			bodyQuoted,
			state
			/* eslint-enable */
		} = message;

		if (!isOwner) {
			return await client.instance.reply('You are not allowed to use this command', {
				from,
				quoted: message.message
			});
		}

		if (!query) {
			return await client.instance.reply('Please specify code to evaluate', { from, quoted: message.message });
		}

		if (isBaileys) {
			return;
		}

		global.where = from;

		if (body.startsWith('/> ')) {
			let types = Function;
			let output;
			let syntaxes = '';

			try {
				if (/await/.test(body)) {
					types = AsyncFunction;
				}

				query = `return ${query}`;
				const func = new types(
					'print',
					'client',
					'message',
					'fs',
					'from',
					'extractMediaData',
					'mediaData',
					'type',
					'typeQuoted',
					'body',
					'adminGroups',
					'participants',
					'pushname',
					'bodyQuoted',
					query
				);

				output = await func.call(
					client,
					async (...args) => {
						return await client.instance.reply(format(...args), { from, quoted: message.message });
					},
					client,
					message,
					fs,
					from,
					extractMediaData,
					mediaData,
					type,
					typeQuoted,
					body,
					adminGroups,
					participantsGroup,
					pushname,
					bodyQuoted
				);
			} catch (e) {
				const err = syntaxerror(query, 'Execution Function', {
					allowReturnOutsideFunction: true,
					allowAwaitOutsideFunction: true,
					sourceType: 'module'
				});

				if (err) {
					syntaxes = `\`\`\`${err}\`\`\`\n\n`;
				}

				output = e;
			} finally {
				client.instance.reply(syntaxes + format(output), { from, quoted: message.message });
			}
		} else if (body.startsWith('$> ')) {
			try {
				exec(body.slice(3), async (err, stdout) => {
					if (err) {
						return await client.instance.reply(format(err), { from, quoted: message.message });
					}

					await client.instance.reply(format(stdout.replace(col, '').trim()), {
						from,
						quoted: message.message
					});
				});
			} catch (err) {
				let str = `Type : ${err.name}\n`;

				str += `Message : ${err.message}`;
				return await client.instance.reply(`\`ERROR\` \`\`\`\n\n${str}\`\`\``, {
					from,
					quoted: message.message
				});
			}
		} else if (body.startsWith('=> ')) {
			try {
				if (/\/s$/.test(query)) {
					query = query.replace(/\/s$/, '');
					print(
						{
							from,
							quoted: message.message
						},
						eval(prettier.js_beautify(query))
					);
				} else {
					print(
						{
							from,
							quoted: message.message
						},
						await eval(
							prettier.js_beautify(`(async () => {
						${query}
								})()
							 .catch(err => print({
								from,
								quoted: message.message,
								
							}, err))`)
						)
					);
				}
			} catch (e) {
				const err = syntaxerror(
					`(async () => {
					${query}
						})()
						.catch(err => print({
							from,
							quoted: message.message,
							
						}, err))`,
					'Execution Function',
					{
						allowReturnOutsideFunction: true,
						allowAwaitOutsideFunction: true,
						sourceType: 'module'
					}
				);
				let str = `Type : ${e.name}\n`;

				str += `Message : ${e.message}`;

				if (err) {
					str += `\`\`\`${err}\`\`\`\n\n`;
				}

				return await client.instance.reply(`\`ERROR\` \`\`\`\n\n${str}\`\`\``, {
					from,
					quoted: message.message
				});
			}
		} else if (body.startsWith('!> ')) {
			let returning;
			let syntaxes = '';
			const queries = `return ${query}`;

			try {
				let i = 15;
				const exportsly = {
					exports: {}
				};
				const exec = new (async () => {}).constructor(
					'print',
					'message',
					'client',
					'store',
					'Array',
					'process',
					'args',
					'',
					'exports',
					'argument',
					queries
				);

				returning = await exec.call(
					client,
					async (...args) => {
						if (--i < 1) {
							return;
						}

						return await client.instance.reply(format(...args), { from, quoted: message.message });
					},
					message,
					client,
					store,
					CustomArray,
					process,
					args,
					groupMetadata,
					exportsly,
					exportsly.exports,
					[client, message]
				);
			} catch (e) {
				const err = syntaxerror(query, 'Execution Function', {
					allowReturnOutsideFunction: true,
					allowAwaitOutsideFunction: true,
					sourceType: 'module'
				});

				if (err) {
					syntaxes = `\`\`\`${err}\`\`\`\n\n`;
				}

				returning = e;
			} finally {
				client.instance.reply(syntaxes + format(returning), { from, quoted: message.message });
			}
		}
	}
};

global.prints = print;
/* eslint-disable-line */ const temp = async (names, func) => {
	if (!/^[a-z0-9_]+$/i.test(names)) {
		return new Error('Invalid name.');
	}

	if (Object.keys(func).includes(names)) {
		return new Error('Function already exists in the script.');
	}

	if (Object.keys(global).includes(names)) {
		return new Error('Function already exists in the temporary functions.');
	}

	if (typeof func !== 'function') {
		return new Error('Argument is not a function.');
	}

	func = prettier.js_beautify(func.toString());
	func = prettier.js_beautify(
		func.split('\n').insert(1, 'try {').insert(-1, '} catch(e) { print(false, format(e))}').join('\n')
	);
	global[names] = func.includes('await')
		? await new AsyncFunction('print', `return ${func}`)()
		: new Function('print', `return ${func}`)();
	global.functions = { ...global.functions, [names]: global[names] };
	return func;
};

/* eslint-disable-line */ const clear = (names) => {
	if (typeof names === 'function') {
		for (const key in global.functions) {
			if (global.functions[key] === names) {
				names = key;
				break;
			}
		}
	}

	if (!/^[a-z0-9_]+$/i.test(names)) {
		return new Error('Invalid name.');
	}

	if (!Object.keys(global).includes(names)) {
		return new Error('Function does not exist.');
	}

	const capt = `Function is deleted\n\n${global[names]}`;

	delete global[names];
	delete global.functions[names];
	return capt;
};

/* eslint-disable-line */ const check = (names) => {
	if (typeof names === 'function') {
		for (const key in global.functions) {
			if (global.functions[key] === names) {
				names = key;
				break;
			}
		}
	}

	if (!/^[a-z0-9_]+$/i.test(names)) {
		return new Error('Invalid name.');
	}

	if (!Object.keys(global).includes(names)) {
		return new Error('Function does not exist.');
	}

	return global[names].toString();
};
