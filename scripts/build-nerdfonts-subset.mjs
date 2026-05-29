#!/usr/bin/env node

/**
 * Nerd Font Subset Builder
 *
 * Scans the dashboard source for used `nf-*` icon classes,
 * generates the minimal CSS, and (optionally) subsets the font.
 *
 * Usage:
 *   node scripts/build-nerdfonts-subset.mjs [--subset]
 *
 * The --subset flag requires `pyftsubset` (from fonttools) to be installed:
 *   pip install fonttools brotli
 *
 * Without --subset, it only regenerates the CSS file.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const CLIENT_DIR = path.resolve('dashboard/client');
const PUBLIC_DIR = path.join(CLIENT_DIR, 'public');
const SERVER_DIR = path.resolve('dashboard/server');
const CSS_PATH = path.join(PUBLIC_DIR, 'nerdfonts.min.css');
const FULL_FONT_PATH = path.resolve('dashboard/client/public/nerdfonts-full.woff2');
const SUBSET_FONT_PATH = path.join(PUBLIC_DIR, 'nerdfonts-subset.woff2');

const ICON_DB_URL = 'https://raw.githubusercontent.com/rainstormstudio/nerd-icons.el/main/data/nerd-icons-data-mdicon.el';
const FA_DB_URL = 'https://raw.githubusercontent.com/rainstormstudio/nerd-icons.el/main/data/nerd-icons-data-faicon.el';

async function scanUsedIcons() {
	const svelte = findFiles(CLIENT_DIR, '.svelte');
	const serverJs = findFiles(SERVER_DIR, '.js');
	const allFiles = [...svelte, ...serverJs];
	const usedClasses = new Set();

	for (const file of allFiles) {
		const content = fs.readFileSync(file, 'utf8');
		const matches = content.matchAll(/nf-(fa|md|dev|oct|cod|seti|custom|weather|pl|ple|iec|linux|pom)-[\w_]+/g);

		for (const [match] of matches) {
			usedClasses.add(match);
		}
	}

	return [...usedClasses].sort();
}

function findFiles(dir, ext) {
	const results = [];

	function walk(d) {
		if (!fs.existsSync(d)) {return;}

		for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
			if (entry.name === 'node_modules' || entry.name === 'dist') {continue;}

			const full = path.join(d, entry.name);

			if (entry.isDirectory()) {
				walk(full);
			} else if (entry.name.endsWith(ext)) {
				results.push(full);
			}
		}
	}

	walk(dir);
	return results;
}

async function fetchIconDb(url) {
	const res = await fetch(url);

	return res.text();
}

function lookupCodepoint(name, dbText) {
	const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const re = new RegExp(`"${escaped}".*?\\\\x([0-9a-f]+)`);
	const m = dbText.match(re);

	return m ? m[1] : null;
}

async function main() {
	const doSubset = process.argv.includes('--subset');
	const usedIcons = await scanUsedIcons();

	console.log(`Found ${usedIcons.length} icon(s) used:\n  ${usedIcons.join('\n  ')}\n`);

	const [mdDb, faDb] = await Promise.all([fetchIconDb(ICON_DB_URL), fetchIconDb(FA_DB_URL)]);

	const resolved = [];

	for (const icon of usedIcons) {
		const db = icon.startsWith('nf-md-') ? mdDb : faDb;
		const cp = lookupCodepoint(icon, db);

		if (cp) {
			resolved.push({ className: icon, codepoint: cp });
		} else {
			console.warn(`  ⚠ Could not resolve codepoint for: ${icon}`);
		}
	}

	let css = `@font-face {\n\tfont-family: 'NerdFontsSymbols Nerd Font';\n\tsrc: url('./nerdfonts-subset.woff2') format('woff2');\n\tfont-weight: normal;\n\tfont-style: normal;\n}\n`;

	css += `.nf {\n\tfont-family: 'NerdFontsSymbols Nerd Font';\n\tfont-style: normal;\n\tfont-weight: normal;\n\t-webkit-font-smoothing: antialiased;\n\t-moz-osx-font-smoothing: grayscale;\n\tline-height: 1;\n}\n`;

	for (const { className, codepoint } of resolved) {
		css += `.${className.replace(/nf-/, 'nf-')}:before {\n\tcontent: '\\${codepoint}';\n}\n`;
	}

	fs.writeFileSync(CSS_PATH, css);
	console.log(`✓ Wrote ${CSS_PATH} (${resolved.length} icons)`);

	if (doSubset) {
		if (!fs.existsSync(FULL_FONT_PATH)) {
			console.error(`\n✗ Full font not found at ${FULL_FONT_PATH}`);
			console.error('  Download SymbolsNerdFont-Regular.ttf from https://github.com/ryanoasis/nerd-fonts/releases');
			console.error('  and place it at the path above.');
			process.exit(1);
		}

		const unicodes = resolved.map((r) => `U+${r.codepoint}`).join(',');

		try {
			execSync(`pyftsubset "${FULL_FONT_PATH}" --unicodes="${unicodes}" --flavor=woff2 --output-file="${SUBSET_FONT_PATH}"`, {
				stdio: 'inherit'
			});
			console.log(`✓ Subset font written to ${SUBSET_FONT_PATH}`);
		} catch {
			console.error('✗ pyftsubset failed. Install with: pip install fonttools brotli');
			process.exit(1);
		}
	}

	console.log('\nDone.');
}

main();
