import * as _ from 'baileys';
import { exec } from 'child_process';
import fs from 'fs';
import prettier from 'js-beautify';
import { format } from 'node:util';
import syntaxerror from 'syntax-error';

import configuration, * as c from '../../helper/config/connect.js';
import * as a from '../../helper/index.js';
import * as d from '../../index.js';
import * as b from '../../utils/index.js';

const func = { ...a, ...b, ...c, ...d, ...configuration }; /* eslint-disable-line */
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const ANSI_REGEX = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
const WAProto = _.WAProto; /* eslint-disable-line */

const SYNTAX_OPTIONS = { allowReturnOutsideFunction: true, allowAwaitOutsideFunction: true, sourceType: 'module' };

class CustomArray extends Array {
	constructor(...args) {
		return typeof args[0] === 'number' ? super(Math.min(args[0], 10_000)) : super(...args);
	}
}

const print = ({ from, quoted, client }, ...args) => client.reply(from, format(...args), quoted);

function checkSyntax(code) {
	const err = syntaxerror(code, 'Execution Function', SYNTAX_OPTIONS);

	return err ? `\`\`\`${err}\`\`\`\n\n` : '';
}

async function evalReturn(ctx) {
	const { from, query, body, message, extractMediaData, mediaData, type, typeQuoted, adminGroups, participantsGroup, pushname, bodyQuoted, client } = ctx;
	let output;
	let syntaxes = '';

	try {
		const FnType = /await/.test(body) ? AsyncFunction : Function;
		const code = `return ${query}`;
		const fn = new FnType('print', 'client', 'message', 'fs', 'from', 'extractMediaData', 'mediaData', 'type', 'typeQuoted', 'body', 'adminGroups', 'participants', 'pushname', 'bodyQuoted', code);

		output = await fn.call(client, (...a) => client.reply(from, format(...a), message.message), client, message, fs, from, extractMediaData, mediaData, type, typeQuoted, body, adminGroups, participantsGroup, pushname, bodyQuoted);
	} catch (e) {
		syntaxes = checkSyntax(query);
		output = e;
	} finally {
		client.reply(from, syntaxes + format(output), message.message);
	}
}

async function evalShell(ctx) {
	const { from, body, message, client } = ctx;

	exec(body.slice(3), async (err, stdout) => {
		if (err) {
			return await client.reply(from, format(err), message.message);
		}

		await client.reply(from, format(stdout.replace(ANSI_REGEX, '').trim()), message.message);
	});
}

async function evalArrow(ctx) {
	const { from, query, message, client } = ctx;

	try {
		if (/\/s$/.test(query)) {
			const code = query.replace(/\/s$/, '');

			print({ from, quoted: message.message, client }, eval(prettier.js_beautify(code)));
		} else {
			const wrapped = prettier.js_beautify(`(async () => { ${query} })().catch(err => print({ from, quoted: message.message, client }, err))`);

			print({ from, quoted: message.message, client }, await eval(wrapped));
		}
	} catch (e) {
		const wrapped = `(async () => { ${query} })().catch(err => print({ from, quoted: message.message, client }, err))`;

		let str = `Type : ${e.name}\nMessage : ${e.message}`;
		const syntaxes = checkSyntax(wrapped);

		if (syntaxes) {
			str += syntaxes;
		}

		await client.reply(from, `\`ERROR\` \n\n\`\`\`${str}\`\`\``, message.message);
	}
}

async function evalBang(ctx) {
	const { from, query, message, groupMetadata, args, client, store } = ctx;
	let output;
	let syntaxes = '';
	const code = `return ${query}`;

	try {
		let i = 15;
		const exportsly = { exports: {} };
		const fn = new AsyncFunction('print', 'message', 'client', 'store', 'Array', 'process', 'args', '', 'exports', 'argument', code);

		output = await fn.call(
			client,
			async (...a) => { if (--i < 1) { return; }

 return await client.reply(from, format(...a), message.message); },
			message, client, store, CustomArray, process, args, groupMetadata, exportsly, exportsly.exports, [client, message]
		);
	} catch (e) {
		syntaxes = checkSyntax(query);
		output = e;
	} finally {
		client.reply(from, syntaxes + format(output), message.message);
	}
}

export default {
	name: 'eval',
	minifiedDescription: 'Evaluate Code',
	description: 'Evaluates code.',
	usage: '!eval `<code>`',
	aliases: ['/>', '$>', '=>', '!>'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run(message, client, store) {
		const { isOwner, isBotInstance, from, body, query } = message;

		if (!isOwner) {
			return await client.reply(from, 'You are not allowed to use this command', message.message);
		}

		if (!query) {
			return await client.reply(from, 'Please specify code to evaluate', message.message);
		}

		if (isBotInstance) {
			return;
		}

		const ctx = { ...message, client, store };

		if (body.startsWith('/> ')) {
			return evalReturn(ctx);
		}

		if (body.startsWith('$> ')) {
			return evalShell(ctx);
		}

		if (body.startsWith('=> ')) {
			return evalArrow(ctx);
		}

		if (body.startsWith('!> ')) {
			return evalBang(ctx);
		}
	}
};

global.prints = print;

const temp = async (names, func) => { /* eslint-disable-line */
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
	func = prettier.js_beautify(func.split('\n').insert(1, 'try {').insert(-1, '} catch(e) { print(false, format(e))}').join('\n'));
	global[names] = func.includes('await')
		? await new AsyncFunction('print', `return ${func}`)()
		: new Function('print', `return ${func}`)();
	global.functions = { ...global.functions, [names]: global[names] };
	return func;
};

const clear = (names) => { /* eslint-disable-line */
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

const check = (names) => { /* eslint-disable-line */
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
