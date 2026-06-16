#!/usr/bin/env node

import { select, checkbox, confirm, input } from '@inquirer/prompts';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

import { GoogleTranslate } from './translate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const I18N_DIR = path.resolve(__dirname, '../i18n');
const LANGUAGES_FILE = path.join(I18N_DIR, 'languages.js');

const loadLanguages = () => {
	try {
		if (!fs.existsSync(LANGUAGES_FILE)) {
			return [
				{ iso: 'id', lang: 'Indonesian', native: 'Bahasa Indonesia' },
				{ iso: 'en', lang: 'English', native: 'English' }
			];
		}

		const content = fs.readFileSync(LANGUAGES_FILE, 'utf8');
		const match = content.match(/export\s+default\s+(\[[\s\S]*\])\s*;?\s*$/);

		if (match) {
			return JSON.parse(match[1]);
		}

		return [
			{ iso: 'id', lang: 'Indonesian', native: 'Bahasa Indonesia' },
			{ iso: 'en', lang: 'English', native: 'English' }
		];
	} catch {
		return [
			{ iso: 'id', lang: 'Indonesian', native: 'Bahasa Indonesia' },
			{ iso: 'en', lang: 'English', native: 'English' }
		];
	}
};

const saveLanguages = (languages) => {
	const content = `export default ${JSON.stringify(languages, null, '\t')};\n`;

	fs.writeFileSync(LANGUAGES_FILE, content, 'utf8');
};

const ALL_LANGUAGES = [
	{ iso: 'af', lang: 'Afrikaans' },
	{ iso: 'sq', lang: 'Albanian' },
	{ iso: 'am', lang: 'Amharic' },
	{ iso: 'ar', lang: 'Arabic' },
	{ iso: 'hy', lang: 'Armenian' },
	{ iso: 'az', lang: 'Azerbaijani' },
	{ iso: 'eu', lang: 'Basque' },
	{ iso: 'be', lang: 'Belarusian' },
	{ iso: 'bn', lang: 'Bengali' },
	{ iso: 'bs', lang: 'Bosnian' },
	{ iso: 'bg', lang: 'Bulgarian' },
	{ iso: 'ca', lang: 'Catalan' },
	{ iso: 'ceb', lang: 'Cebuano' },
	{ iso: 'zh-CN', lang: 'Chinese (Simplified)' },
	{ iso: 'zh-TW', lang: 'Chinese (Traditional)' },
	{ iso: 'co', lang: 'Corsican' },
	{ iso: 'hr', lang: 'Croatian' },
	{ iso: 'cs', lang: 'Czech' },
	{ iso: 'da', lang: 'Danish' },
	{ iso: 'nl', lang: 'Dutch' },
	{ iso: 'eo', lang: 'Esperanto' },
	{ iso: 'et', lang: 'Estonian' },
	{ iso: 'fi', lang: 'Finnish' },
	{ iso: 'fr', lang: 'French' },
	{ iso: 'fy', lang: 'Frisian' },
	{ iso: 'gl', lang: 'Galician' },
	{ iso: 'ka', lang: 'Georgian' },
	{ iso: 'de', lang: 'German' },
	{ iso: 'el', lang: 'Greek' },
	{ iso: 'gu', lang: 'Gujarati' },
	{ iso: 'ht', lang: 'Haitian Creole' },
	{ iso: 'ha', lang: 'Hausa' },
	{ iso: 'haw', lang: 'Hawaiian' },
	{ iso: 'he', lang: 'Hebrew' },
	{ iso: 'hi', lang: 'Hindi' },
	{ iso: 'hmn', lang: 'Hmong' },
	{ iso: 'hu', lang: 'Hungarian' },
	{ iso: 'is', lang: 'Icelandic' },
	{ iso: 'ig', lang: 'Igbo' },
	{ iso: 'ga', lang: 'Irish' },
	{ iso: 'it', lang: 'Italian' },
	{ iso: 'ja', lang: 'Japanese' },
	{ iso: 'jv', lang: 'Javanese' },
	{ iso: 'kn', lang: 'Kannada' },
	{ iso: 'kk', lang: 'Kazakh' },
	{ iso: 'km', lang: 'Khmer' },
	{ iso: 'rw', lang: 'Kinyarwanda' },
	{ iso: 'ko', lang: 'Korean' },
	{ iso: 'ku', lang: 'Kurdish' },
	{ iso: 'ky', lang: 'Kyrgyz' },
	{ iso: 'lo', lang: 'Lao' },
	{ iso: 'la', lang: 'Latin' },
	{ iso: 'lv', lang: 'Latvian' },
	{ iso: 'lt', lang: 'Lithuanian' },
	{ iso: 'lb', lang: 'Luxembourgish' },
	{ iso: 'mk', lang: 'Macedonian' },
	{ iso: 'mg', lang: 'Malagasy' },
	{ iso: 'ms', lang: 'Malay' },
	{ iso: 'ml', lang: 'Malayalam' },
	{ iso: 'mt', lang: 'Maltese' },
	{ iso: 'mi', lang: 'Maori' },
	{ iso: 'mr', lang: 'Marathi' },
	{ iso: 'mn', lang: 'Mongolian' },
	{ iso: 'my', lang: 'Myanmar (Burmese)' },
	{ iso: 'ne', lang: 'Nepali' },
	{ iso: 'no', lang: 'Norwegian' },
	{ iso: 'ny', lang: 'Nyanja (Chichewa)' },
	{ iso: 'or', lang: 'Odia (Oriya)' },
	{ iso: 'ps', lang: 'Pashto' },
	{ iso: 'fa', lang: 'Persian' },
	{ iso: 'pl', lang: 'Polish' },
	{ iso: 'pt', lang: 'Portuguese' },
	{ iso: 'pa', lang: 'Punjabi' },
	{ iso: 'ro', lang: 'Romanian' },
	{ iso: 'ru', lang: 'Russian' },
	{ iso: 'sm', lang: 'Samoan' },
	{ iso: 'gd', lang: 'Scots Gaelic' },
	{ iso: 'sr', lang: 'Serbian' },
	{ iso: 'st', lang: 'Sesotho' },
	{ iso: 'sn', lang: 'Shona' },
	{ iso: 'sd', lang: 'Sindhi' },
	{ iso: 'si', lang: 'Sinhala' },
	{ iso: 'sk', lang: 'Slovak' },
	{ iso: 'sl', lang: 'Slovenian' },
	{ iso: 'so', lang: 'Somali' },
	{ iso: 'es', lang: 'Spanish' },
	{ iso: 'su', lang: 'Sundanese' },
	{ iso: 'sw', lang: 'Swahili' },
	{ iso: 'sv', lang: 'Swedish' },
	{ iso: 'tl', lang: 'Tagalog (Filipino)' },
	{ iso: 'tg', lang: 'Tajik' },
	{ iso: 'ta', lang: 'Tamil' },
	{ iso: 'tt', lang: 'Tatar' },
	{ iso: 'te', lang: 'Telugu' },
	{ iso: 'th', lang: 'Thai' },
	{ iso: 'tr', lang: 'Turkish' },
	{ iso: 'tk', lang: 'Turkmen' },
	{ iso: 'uk', lang: 'Ukrainian' },
	{ iso: 'ur', lang: 'Urdu' },
	{ iso: 'ug', lang: 'Uyghur' },
	{ iso: 'uz', lang: 'Uzbek' },
	{ iso: 'vi', lang: 'Vietnamese' },
	{ iso: 'cy', lang: 'Welsh' },
	{ iso: 'xh', lang: 'Xhosa' },
	{ iso: 'yi', lang: 'Yiddish' },
	{ iso: 'yo', lang: 'Yoruba' },
	{ iso: 'zu', lang: 'Zulu' }
];

const loadNamespace = (namespace, locale) => {
	const filePath = path.join(I18N_DIR, namespace, `${locale}.js`);

	if (!fs.existsSync(filePath)) {
		return null;
	}

	try {
		const content = fs.readFileSync(filePath, 'utf8');
		const match = content.match(/export\s+default\s+(?:\/\*\*[^*]*\*\/\s*)?(\([\s\S]*\)|\{[\s\S]*\})\s*;?\s*$/);

		if (match) {
			let code = match[1];

			if (code.startsWith('{')) {
				code = `(${code})`;
			}

			return eval(code);
		}
	} catch {
		return null;
	}
};

const saveNamespace = (namespace, locale, data) => {
	const dir = path.join(I18N_DIR, namespace);

	fs.ensureDirSync(dir);

	const filePath = path.join(dir, `${locale}.js`);
	const content = `export default /** @type {const} */ (${JSON.stringify(data, null, '\t')});\n`;

	fs.writeFileSync(filePath, content, 'utf8');
};

const flattenKeys = (obj, prefix = '') => {
	const keys = [];

	for (const [key, value] of Object.entries(obj)) {
		const fullKey = prefix ? `${prefix}.${key}` : key;

		if (Array.isArray(value)) {
			for (let i = 0; i < value.length; i++) {
				const item = value[i];
				const itemKey = `${fullKey}.${i}`;

				if (typeof item === 'object' && item !== null) {
					keys.push(...flattenKeys(item, itemKey));
				} else {
					keys.push({ key: itemKey, value: item });
				}
			}
		} else if (typeof value === 'object' && value !== null) {
			keys.push(...flattenKeys(value, fullKey));
		} else {
			keys.push({ key: fullKey, value });
		}
	}

	return keys;
};

const unflattenKeys = (flat) => {
	const result = {};

	for (const { key, value } of flat) {
		const parts = key.split('.');
		let current = result;

		for (let i = 0; i < parts.length - 1; i++) {
			const nextPart = parts[i + 1];
			const isNextArray = /^\d+$/.test(nextPart);

			if (!current[parts[i]]) {
				current[parts[i]] = isNextArray ? [] : {};
			}

			current = current[parts[i]];
		}

		const lastPart = parts[parts.length - 1];

		if (Array.isArray(current) && /^\d+$/.test(lastPart)) {
			current[parseInt(lastPart, 10)] = value;
		} else {
			current[lastPart] = value;
		}
	}

	return result;
};

const translateValue = async (translator, text, from, to) => {
	if (Array.isArray(text)) {
		const results = [];

		for (const item of text) {
			if (typeof item === 'string') {
				const result = await translator.translate(item, { from, to, skipDelay: false });

				results.push(result.text);
			} else {
				results.push(item);
			}
		}

		return results;
	}

	if (typeof text === 'string') {
		const result = await translator.translate(text, { from, to, skipDelay: false });

		return result.text;
	}

	return text;
};

const translateNamespace = async (translator, namespace, fromLocale, toLocale) => {
	const source = loadNamespace(namespace, fromLocale);

	if (!source) {
		console.error(`Namespace "${namespace}" not found for locale "${fromLocale}".`);
		return null;
	}

	const existing = loadNamespace(namespace, toLocale) || {};
	const flatSource = flattenKeys(source);
	const flatExisting = flattenKeys(existing);
	const existingKeys = new Set(flatExisting.map((f) => f.key));

	const progressFile = path.join(I18N_DIR, namespace, `.${toLocale}.progress.json`);

	let savedProgress = {};

	try {
		if (fs.existsSync(progressFile)) {
			savedProgress = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
			console.log(`  \x1b[33mFound saved progress (${Object.keys(savedProgress).length} keys). Resuming...\x1b[0m`);
		}
	} catch {
		savedProgress = {};
	}

	const toTranslate = flatSource.filter((f) => !existingKeys.has(f.key) && !savedProgress[f.key]);

	const translated = [];
	const succeeded = [];
	const failed = [];

	for (const [key, value] of Object.entries(savedProgress)) {
		translated.push({ key, value });
		succeeded.push(key);
	}

	if (toTranslate.length === 0 && Object.keys(savedProgress).length === 0) {
		console.log(`All keys already translated for "${namespace}" → ${toLocale}.`);
		return existing;
	}

	if (toTranslate.length === 0 && Object.keys(savedProgress).length > 0) {
		console.log(`  \x1b[32m✓ All remaining keys loaded from saved progress.\x1b[0m`);

		const merged = unflattenKeys([...flatExisting, ...translated]);

		fs.removeSync(progressFile);
		return merged;
	}

	console.log(`\nTranslating ${toTranslate.length} new keys for "${namespace}" → ${toLocale}...\n`);

	const truncate = (str, max = 40) => {
		const flat = typeof str === 'string' ? str.replace(/\n/g, ' ') : String(str);

		return flat.length > max ? `${flat.slice(0, max)}…` : flat;
	};

	const SKIP_TRANSLATION_KEYS = new Set(['category', 'correct']);

	const translateItem = async (item, index) => {
		const { key, value } = item;
		const lastKey = key.split('.').pop();

		if (SKIP_TRANSLATION_KEYS.has(lastKey)) {
			return { key, value, result: value, skipped: true, index };
		}

		try {
			const result = await translateValue(translator, value, fromLocale, toLocale);

			return { key, value, result, skipped: false, index };
		} catch (err) {
			return { key, value, error: err.message, skipped: false, index };
		}
	};

	const concurrency = 5;
	const chunks = [];

	for (let i = 0; i < toTranslate.length; i += concurrency) {
		chunks.push(toTranslate.slice(i, i + concurrency));
	}

	let completed = 0;
	const skippedItems = [];
	const failedItems = [];
	const successItems = [];
	const startTime = Date.now();
	const previewLines = 5;
	let showPreview = false;
	let latestItems = [];
	let interrupted = false;

	const formatTime = (ms) => {
		const seconds = Math.floor(ms / 1000);

		if (seconds < 60) {
			return `${seconds}s`;
		}

		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;

		return `${minutes}m ${remainingSeconds}s`;
	};

	const clearLines = (count) => {
		for (let i = 0; i < count; i++) {
			process.stdout.write('\x1b[1A\x1b[2K');
		}
	};

	const printStatus = (completed, total, startTime) => {
		const elapsed = Date.now() - startTime;
		const avgTime = elapsed / completed;
		const remaining = avgTime * (total - completed);

		console.log(`  \x1b[90mTranslating... ${completed}/${total} | Elapsed: ${formatTime(elapsed)} | Est. remaining: ${formatTime(remaining)} | Press 'p' to ${showPreview ? 'hide' : 'show'} preview\x1b[0m`);
	};

	const printPreviewItems = (items) => {
		for (const item of items) {
			if (item.error) {
				console.log(`  \x1b[31m${item.key}\x1b[0m  ${truncate(item.value)} \u2192 \x1b[31m${item.error}\x1b[0m`);
			} else if (item.skipped) {
				console.log(`  \x1b[36m${item.key}\x1b[0m  ${truncate(item.value)} \u2192 skipped`);
			} else {
				console.log(`  ${item.key}  ${truncate(item.value)} \u2192 ${truncate(item.result)}`);
			}
		}
	};

	const saveProgress = () => {
		const progressData = { ...savedProgress };

		for (const item of successItems) {
			progressData[item.key] = item.result;
		}

		for (const item of skippedItems) {
			progressData[item.key] = item.value;
		}

		if (Object.keys(progressData).length > 0) {
			fs.writeJsonSync(progressFile, progressData, { spaces: '\t' });
			console.log(`\n  \x1b[33m✓ Progress saved (${Object.keys(progressData).length} keys). Run again to resume.\x1b[0m`);
		}
	};

	if (process.stdin.isTTY) {
		process.stdin.setRawMode(true);
		process.stdin.resume();
		process.stdin.setEncoding('utf8');

		process.stdin.on('data', (key) => {
			if (key === 'p' || key === 'P') {
				clearLines(1);

				if (showPreview) {
					clearLines(latestItems.length);
					showPreview = false;
				} else {
					showPreview = true;
					printPreviewItems(latestItems);
				}

				printStatus(completed, toTranslate.length, startTime);
			}

			if (key === '\u0003') {
				interrupted = true;
			}
		});
	}

	printStatus(0, toTranslate.length, startTime);

	for (const chunk of chunks) {
		if (interrupted) {
			break;
		}

		const results = await Promise.all(chunk.map((item, idx) => translateItem(item, completed + idx)));

		for (const result of results) {
			completed++;

			if (result.skipped) {
				skippedItems.push(result);
				translated.push({ key: result.key, value: result.value });
				succeeded.push(result.key);
			} else if (result.error) {
				failedItems.push(result);
				failed.push({ key: result.key, error: result.error });
			} else {
				successItems.push(result);
				translated.push({ key: result.key, value: result.result });
				succeeded.push(result.key);
			}
		}

		latestItems = results.slice(-previewLines);

		if (showPreview) {
			clearLines(latestItems.length + 1);
			printPreviewItems(latestItems);
		} else {
			clearLines(1);
		}

		printStatus(completed, toTranslate.length, startTime);
	}

	if (process.stdin.isTTY) {
		process.stdin.setRawMode(false);
		process.stdin.pause();
	}

	if (interrupted) {
		saveProgress();
		process.exit(0);
	}

	console.log('\n');

	if (failedItems.length > 0) {
		console.log(`\x1b[31m✗ ${failedItems.length} failed:\x1b[0m`);

		for (const item of failedItems) {
			console.log(`  \x1b[31m${item.key}\x1b[0m  ${truncate(item.value)} \u2192 \x1b[31m${item.error}\x1b[0m`);
		}

		console.log();
	}

	if (skippedItems.length > 0) {
		console.log(`\x1b[36m⊘ ${skippedItems.length} skipped (metadata):\x1b[0m`);

		for (const item of skippedItems) {
			console.log(`  \x1b[36m${item.key}\x1b[0m  ${truncate(item.value)}`);
		}

		console.log();
	}

	if (successItems.length > 0) {
		console.log(`\x1b[32m✓ ${successItems.length} translated:\x1b[0m`);

		for (const item of successItems) {
			console.log(`  ${item.key}  ${truncate(item.value)} \u2192 ${truncate(item.result)}`);
		}
	}

	const merged = unflattenKeys([...flatExisting, ...translated]);

	if (fs.existsSync(progressFile)) {
		fs.removeSync(progressFile);
	}

	return merged;
};

const listNamespaces = () => {
	if (!fs.existsSync(I18N_DIR)) {
		return [];
	}

	return fs.readdirSync(I18N_DIR).filter((entry) => {
		const fullPath = path.join(I18N_DIR, entry);

		return fs.statSync(fullPath).isDirectory();
	});
};

const main = async () => {
	console.log('\n🌐 Aestherix i18n Translation Generator\n');

	const languages = loadLanguages();
	const namespaces = listNamespaces();

	const action = await select({
		message: 'What do you want to do?',
		choices: [
			{ name: 'Translate a namespace', value: 'translate' },
			{ name: 'Add language', value: 'add' },
			{ name: 'Remove language', value: 'remove' },
			{ name: 'List languages', value: 'list' },
			{ name: 'Check coverage', value: 'coverage' }
		]
	});

	if (action === 'list') {
		console.log('\nLanguages:');

		for (const lang of languages) {
			console.log(`  ${lang.iso}: ${lang.lang}${lang.native ? ` (${lang.native})` : ''}`);
		}

		return;
	}

	if (action === 'add') {
		const existingIsos = new Set(languages.map((l) => l.iso));
		const available = ALL_LANGUAGES.filter((l) => !existingIsos.has(l.iso));

		if (available.length === 0) {
			console.log('All supported languages are already added.');
			return;
		}

		const mode = await select({
			message: 'How do you want to add?',
			choices: [
				{ name: 'Pick from list', value: 'list' },
				{ name: 'Enter manually', value: 'manual' }
			]
		});

		if (mode === 'list') {
			const selected = await checkbox({
				message: 'Select languages to add:',
				choices: available.map((l) => ({ name: `${l.lang} (${l.iso})`, value: l.iso })),
				required: true
			});

			for (const iso of selected) {
				const lang = ALL_LANGUAGES.find((l) => l.iso === iso);

				if (lang && !languages.find((l) => l.iso === iso)) {
					languages.push({ iso: lang.iso, lang: lang.lang, native: lang.lang });
				}
			}

			saveLanguages(languages);
			console.log(`\n✓ Added ${selected.length} language(s). Run translate to generate strings.`);
		} else {
			const iso = await input({ message: 'Language ISO code (e.g. "th"):' });
			const langName = await input({ message: 'Language name (e.g. "Thai"):' });
			const native = await input({ message: 'Native name (e.g. "ไทย"):' });

			if (languages.find((l) => l.iso === iso)) {
				console.log(`Language "${iso}" already exists.`);
				return;
			}

			languages.push({ iso, lang: langName, native: native || langName });
			saveLanguages(languages);
			console.log(`\n✓ Added ${langName} (${iso}).`);
		}

		return;
	}

	if (action === 'remove') {
		if (languages.length <= 2) {
			console.log('Cannot remove — need at least 2 languages.');
			return;
		}

		const toRemove = await checkbox({
			message: 'Select languages to remove:',
			choices: languages.map((l) => ({ name: `${l.lang} (${l.iso})`, value: l.iso })),
			required: true
		});

		const filtered = languages.filter((l) => !toRemove.includes(l.iso));

		saveLanguages(filtered);
		console.log(`\n✓ Removed ${toRemove.length} language(s).`);

		return;
	}

	if (action === 'coverage') {
		if (namespaces.length === 0) {
			console.log('No namespaces found. Create a namespace first in src/i18n/');
			return;
		}

		const namespace = await select({
			message: 'Select namespace:',
			choices: namespaces.map((ns) => ({ name: ns, value: ns }))
		});

		const availableBaseLocales = languages
			.filter((l) => loadNamespace(namespace, l.iso) !== null)
			.map((l) => ({ name: `${l.lang} (${l.iso})`, value: l.iso }));

		if (availableBaseLocales.length === 0) {
			console.log(`No translations found for "${namespace}".`);
			return;
		}

		const baseLocale = await select({
			message: 'Base locale:',
			choices: availableBaseLocales
		});

		const base = loadNamespace(namespace, baseLocale);

		if (!base) {
			console.log(`No data for "${namespace}" in "${baseLocale}".`);
			return;
		}

		const baseKeys = new Set(flattenKeys(base).map((f) => f.key));

		console.log(`\nCoverage for "${namespace}" (base: ${baseLocale}):\n`);

		for (const lang of languages) {
			if (lang.iso === baseLocale) {
				continue;
			}

			const data = loadNamespace(namespace, lang.iso);

			if (!data) {
				console.log(`  ${lang.iso}: 0/${baseKeys.size} (0%)`);
				continue;
			}

			const keys = new Set(flattenKeys(data).map((f) => f.key));
			const covered = [...baseKeys].filter((k) => keys.has(k)).length;
			const pct = Math.round((covered / baseKeys.size) * 100);

			console.log(`  ${lang.iso}: ${covered}/${baseKeys.size} (${pct}%)`);
		}

		return;
	}

	if (action === 'translate') {
		if (namespaces.length === 0) {
			console.log('No namespaces found. Create a namespace first in src/i18n/');
			return;
		}

		const namespace = await select({
			message: 'Select namespace to translate:',
			choices: namespaces.map((ns) => ({ name: ns, value: ns }))
		});

		const availableSources = languages
			.filter((l) => loadNamespace(namespace, l.iso) !== null)
			.map((l) => ({ name: `${l.lang} (${l.iso})`, value: l.iso }));

		if (availableSources.length === 0) {
			console.log(`No translations found for "${namespace}". Add a base translation first.`);
			return;
		}

		const fromLocale = await select({
			message: 'Source locale:',
			choices: availableSources
		});

		const targetChoices = languages
			.filter((l) => l.iso !== fromLocale)
			.map((l) => ({ name: `${l.lang} (${l.iso})`, value: l.iso }));

		const toLocales = await checkbox({
			message: 'Target locale(s):',
			choices: targetChoices,
			required: true
		});

		const delayStr = await input({
			message: 'Delay between requests (ms):',
			default: '1000'
		});
		const delay = parseInt(delayStr, 10) || 1000;

		const translator = new GoogleTranslate({ delay });

		console.log(`\nStarting translation: ${fromLocale} → ${toLocales.join(', ')}`);
		console.log(`Namespace: ${namespace}`);
		console.log(`Delay: ${delay}ms\n`);

		const proceed = await confirm({ message: 'Proceed?', default: true });

		if (!proceed) {
			console.log('Cancelled.');
			return;
		}

		for (const toLocale of toLocales) {
			const result = await translateNamespace(translator, namespace, fromLocale, toLocale);

			if (result) {
				saveNamespace(namespace, toLocale, result);
				console.log(`\n✓ Saved ${namespace}/${toLocale}.js\n`);
			}
		}

		console.log('Done!');
	}
};

main().catch(console.error);
