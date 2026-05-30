import vm from 'node:vm';
import { YoutubeError } from './errors.js';
import { newSpliceFunc, newSwapFunc, reverseFunc } from './decipher-operations.js';

const jsvar = String.raw`[a-zA-Z_\$][a-zA-Z_0-9]*`;
const reverseStr = String.raw`:function\(a\)\{(?:return )?a\.reverse\(\)\}`;
const spliceStr = String.raw`:function\(a,b\)\{a\.splice\(0,b\)\}`;
const swapStr = String.raw`:function\(a,b\)\{var c=a\[0\];a\[0\]=a\[b(?:%a\.length)?\];a\[b(?:%a\.length)?\]=c(?:;return a)?\}`;

const nFunctionNameRegexp = new RegExp(String.raw`\.get\("n"\)\)&&\(b=([a-zA-Z0-9$]{0,3})\[(\d+)\](.+)\|\|([a-zA-Z0-9]{0,3})`);
const actionsObjRegexp = new RegExp(
	`var (${jsvar})=\\{((?:(?:${jsvar}${swapStr}|${jsvar}${spliceStr}|${jsvar}${reverseStr}),?\\n?)+)\\};`
);
const actionsFuncRegexp = new RegExp(
	`function(?: ${jsvar})?\\(a\\)\\{a=a\\.split\\(""\\);\\s*((?:(?:a=)?${jsvar}\\.${jsvar}\\(a,\\d+\\);)+)return a\\.join\\(""\\)\\}`
);
const reverseRegexp = new RegExp(`(?:^|,)(${jsvar})${reverseStr}`, 'm');
const spliceRegexp = new RegExp(`(?:^|,)(${jsvar})${spliceStr}`, 'm');
const swapRegexp = new RegExp(`(?:^|,)(${jsvar})${swapStr}`, 'm');

function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class Decipher {
	constructor(playerConfig) {
		this.config = playerConfig;
	}

	decipherURL(cipher) {
		const params = new URLSearchParams(cipher);
		const uri = new URL(params.get('url'));
		const decrypted = this.decrypt(params.get('s'));

		uri.searchParams.set(params.get('sp') || 'signature', decrypted);
		this.decryptNParam(uri.searchParams);
		return uri.toString();
	}

	unThrottleURL(urlString) {
		const uri = new URL(urlString);

		this.decryptNParam(uri.searchParams);
		return uri.toString();
	}

	decryptNParam(searchParams) {
		const nSig = searchParams.get('v');

		if (nSig) {
			searchParams.set('v', this.decodeNsig(nSig));
		}
	}

	decodeNsig(encoded) {
		const fnBody = this.getNFunction();

		return Decipher.evalJavascript(fnBody, encoded);
	}

	static evalJavascript(jsFunction, arg) {
		const context = vm.createContext({});
		const fn = vm.runInContext(`var myFunction;myFunction=${jsFunction};myFunction`, context);

		return fn(arg);
	}

	getNFunction() {
		const nameResult = nFunctionNameRegexp.exec(this.config);

		if (!nameResult) {
			throw new YoutubeError('unable to extract n-function name');
		}

		const idx = parseInt(nameResult[2], 10);
		const name = idx === 0 ? nameResult[4] : nameResult[1];

		return this.extraFunction(name);
	}

	extraFunction(name) {
		const def = `${name}=function(`;
		const start = this.config.indexOf(def);

		if (start < 1) {
			throw new YoutubeError(`unable to extract n-function body: looking for '${def}'`);
		}

		let pos = this.config.indexOf('{', start) + 1;
		let strChar = 0;

		for (let brackets = 1; brackets > 0; pos++) {
			const b = this.config[pos];

			if (b === '{') {
				if (strChar === 0) {
					brackets++;
				}
			} else if (b === '}') {
				if (strChar === 0) {
					brackets--;
				}
			} else if (b === '`' || b === '"' || b === "'") {
				if (this.config[pos - 1] === '\\' && this.config[pos - 2] !== '\\') {
					continue;
				}

				if (strChar === 0) {
					strChar = b;
				} else if (strChar === b) {
					strChar = 0;
				}
			}
		}

		return this.config.slice(start, pos);
	}

	decrypt(signature) {
		const operations = this.parseDecipherOps();
		let chars = signature.split('');

		for (const op of operations) {
			chars = op(chars);
		}

		return chars.join('');
	}

	parseDecipherOps() {
		const objResult = actionsObjRegexp.exec(this.config);
		const funcResult = actionsFuncRegexp.exec(this.config);

		if (!objResult || !funcResult) {
			throw new YoutubeError('error parsing signature tokens');
		}

		const obj = objResult[1];
		const objBody = objResult[2];
		const funcBody = funcResult[1];

		const reverseMatch = reverseRegexp.exec(objBody);
		const spliceMatch = spliceRegexp.exec(objBody);
		const swapMatch = swapRegexp.exec(objBody);
		const reverseKey = reverseMatch ? reverseMatch[1] : '';
		const spliceKey = spliceMatch ? spliceMatch[1] : '';
		const swapKey = swapMatch ? swapMatch[1] : '';

		const keys = [reverseKey, spliceKey, swapKey].filter(Boolean).map(escapeRegex).join('|');
		const opRegex = new RegExp(`(?:a=)?${escapeRegex(obj)}\\.(${keys})\\(a,(\\d+)\\)`, 'g');

		const operations = [];
		let match;

		while ((match = opRegex.exec(funcBody))) {
			const arg = parseInt(match[2], 10);

			switch (match[1]) {
				case reverseKey:
					operations.push(reverseFunc);
					break;
				case swapKey:
					operations.push(newSwapFunc(arg));
					break;
				case spliceKey:
					operations.push(newSpliceFunc(arg));
					break;
			}
		}
		return operations;
	}
}
