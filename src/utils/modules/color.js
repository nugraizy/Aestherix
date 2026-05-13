import boxen from 'boxen';
import chalk from 'chalk';
import fs from 'fs-extra';
import gradient from 'gradient-string';
import _ from 'lodash';

import { THEMES } from './themes/index.js';

export class LoggerThemeManager {
	constructor(themes, defaultTheme = 'dracula') {
		this.themes = themes || {};
		this.setTheme(defaultTheme);
	}

	setTheme(name) {
		const key = String(name || '').toLowerCase();
		const themeKey = this.themes[key] ? key : 'dracula';

		this.name = themeKey;
		this.palette = { ...this.themes[themeKey] };
	}

	resolveColor(value) {
		if (typeof value === 'string' && this.palette?.[value]) {
			return this.palette[value];
		}

		return value;
	}

	apply(...obj) {
		if (obj.length % 2 !== 0) {
			log('Invalid Number of arguments. Please pairs of text and color.', obj);
			return;
		}

		let str = '';

		for (let i = 0; i < obj.length; i += 2) {
			const text = obj[i];
			const rawColor = obj[i + 1];
			const resolved = this.resolveColor(rawColor);

			str +=
				typeof resolved === 'object'
					? gradient(resolved)(text)
					: typeof resolved === 'string'
						? chalk[resolved]?.(text) || chalk.hex(resolved)(text)
						: (() => {
								const schemes = _.sample(['teen', 'passion', 'instagram']);

								return gradient[schemes](text);
							})();
		}

		return str;
	}
}

const themeManager = new LoggerThemeManager(THEMES, 'dracula');

const applyThemeProps = (target, palette) => {
	const keys = Object.keys(palette || {});
	const props = {};

	for (const key of keys) {
		props[key] = palette[key];
	}

	Object.assign(target, props, {
		theme: palette
	});
};

/**
 * @typedef {'red'|'orange'|'yellow'|'green'|'cyan'|'blue'|'purple'|'pink'
 * |'neonGreen'|'indigo'|'teal'|'periwinkle'|'mint'|'softGreen'|'powderBlue'
 * |'lavender'|'lilac'|'salmon'|'magenta'|'amber'|'rose'|'lemon'|'glowYellow'
 * |'black'|'darkGray'|'lightGray'|'slate'|'steel'|'silver'|'gold'|'aqua'
 * |'sky'|'violet'|'coral'|'lime'|'olive'|'maroon'|'white'|'gray'
 * |'foreground'|'background'} ThemeColorName
 */

/**
 * Applies themed colors to text strings.
 * Accepts pairs of (text, colorName) arguments.
 *
 * @type {((text: string, color: ThemeColorName | (string & {})) => string) & {
 *   setTheme: (name: string) => string,
 *   getTheme: () => string,
 *   getThemes: () => string[],
 *   getHex: (name: ThemeColorName) => string,
 *   theme: Record<string, string>
 * }}
 */
export const color = Object.assign((...obj) => themeManager.apply(...obj), {
	setTheme: (name) => {
		themeManager.setTheme(name);
		applyThemeProps(color, themeManager.palette);
		return themeManager.name;
	},
	getTheme: () => themeManager.name,
	getThemes: () => Object.keys(THEMES),
	getHex: (name) => themeManager.palette[name] || null,
	getSyntaxTheme: () => {
		const palette = themeManager.palette;
		const mapping = palette.syntax || {};
		const resolved = {};

		for (const [token, colorName] of Object.entries(mapping)) {
			resolved[token] = chalk.hex(palette[colorName] || colorName);
		}

		return resolved;
	},
	theme: themeManager.palette
});

applyThemeProps(color, themeManager.palette);

const ICON = color('ᛟ', 'lilac');
const BANNER_ICON_1 = color('❝', 'red');
const BANNER_ICON_2 = color('❞', 'red');
const { version } = await fs.readJSON('./package.json');
const SPLITTER = color('●', 'darkGray');
const AUTHOR = color('nugraizy', 'red');

export const printBanner = () =>
	console.log(
		boxen(
			`${BANNER_ICON_1}${chalk.italic.bold.hex(themeManager.palette.purple || '#BD93F9')(__botName)}${BANNER_ICON_2}
version
${version.split(/\./g).join(` ${SPLITTER} `)}`,
			{
				title: `${ICON} Made by @${AUTHOR} ${ICON}`,
				textAlignment: 'center',
				float: 'left',
				borderColor: 'gray',
				margin: 1,
				borderStyle: 'round'
			}
		)
	);
