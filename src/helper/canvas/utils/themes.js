export const graphThemes = {
	DEFAULT: { isDark: false, background: '#FFFFFF', accent: '#8B6CFA', accentFaded: 'rgba(175,143,251,0.3)', text: '#245278', border: 'rgba(108, 122, 137, 0.3)', graph: ['#9BB1DA', '#668ADA', '#4771DA', '#2E63C9', '#1E53D9'] },
	DRACULA: { isDark: true, background: '#282A36', accent: '#F8F8F2', accentFaded: '#FF79C6', text: '#50FA7B', border: 'rgba(239, 239, 240, 0.3)', graph: ['#3A2648', '#5A3E78', '#7A56A8', '#9A6ED8', '#BD36F9'] },
	GRUVBOX: { isDark: true, background: '#282828', accent: '#EBDBB2', accentFaded: '#FB4934', text: '#B8BB26', border: 'rgba(235, 219, 178, 0.3)', graph: ['#3C3836', '#6C5036', '#9C6836', '#CC8036', '#FABD2F'] },
	SOLARIZED_LIGHT: { isDark: false, background: '#FDF6E3', accent: '#657B83', accentFaded: '#268BD2', text: '#859900', border: 'rgba(101, 123, 131, 0.3)', graph: ['#EEE8D5', '#C9D6A2', '#A3C46F', '#7DB23C', '#859900'] },
	SOLARIZED_DARK: { isDark: true, background: '#002B36', accent: '#839496', accentFaded: '#268BD2', text: '#2AA198', border: 'rgba(131, 148, 150, 0.3)', graph: ['#073642', '#1C4C60', '#316680', '#4680A0', '#268BD2'] },
	NORD: { isDark: true, background: '#2E3440', accent: '#D8DEE9', accentFaded: '#88C0D0', text: '#A3BE8C', border: 'rgba(216, 222, 233, 0.3)', graph: ['#3B4252', '#47556A', '#537882', '#5F9B9A', '#88C0D0'] },
	MONOKAI: { isDark: true, background: '#272822', accent: '#F8F8F2', accentFaded: '#F92672', text: '#A6E22E', border: 'rgba(248, 248, 242, 0.3)', graph: ['#49483E', '#6D6553', '#918268', '#B59F7D', '#FD971F'] },
	CATPPUCCIN_LATTE: { isDark: false, background: '#EFF1F5', accent: '#4C4F69', accentFaded: '#D20F39', text: '#40A02B', border: 'rgba(76, 79, 105, 0.3)', graph: ['#BCC0CC', '#95A2D0', '#6E84D4', '#4866D8', '#1E66F5'] },
	CATPPUCCIN_FRAPPE: { isDark: true, background: '#303446', accent: '#C6D0F5', accentFaded: '#E78284', text: '#A6D189', border: 'rgba(198, 208, 245, 0.3)', graph: ['#51576D', '#6675A0', '#7B93D3', '#90B1F6', '#8CAAEE'] },
	CATPPUCCIN_MACCHIATO: { isDark: true, background: '#24273A', accent: '#CAD3F5', accentFaded: '#ED8796', text: '#A6DA95', border: 'rgba(202, 211, 245, 0.3)', graph: ['#494D64', '#6475A0', '#7F9DDC', '#9AC5FF', '#8AADF4'] },
	CATPPUCCIN_MOCHA: { isDark: true, background: '#1E1E2E', accent: '#CDD6F4', accentFaded: '#F38BA8', text: '#A6E3A1', border: 'rgba(205, 214, 244, 0.3)', graph: ['#45475A', '#5D6A90', '#759DC6', '#8DD0FC', '#89B4FA'] },
	ROSE_PINE: { isDark: true, background: '#191724', accent: '#E0DEF4', accentFaded: '#EB6F92', text: '#9CCFD8', border: 'rgba(224, 222, 244, 0.3)', graph: ['#2A1E34', '#5A3E64', '#8A5E94', '#BA7EC4', '#EB6F92'] },
	ROSE_PINE_MOON: { isDark: true, background: '#232136', accent: '#E0DEF4', accentFaded: '#EB6F92', text: '#3E8FB0', border: 'rgba(224, 222, 244, 0.3)', graph: ['#393552', '#59607C', '#799BA6', '#99D6D0', '#9CCFD8'] },
	ROSE_PINE_DAWN: { isDark: false, background: '#FAF4ED', accent: '#575279', accentFaded: '#B4637A', text: '#56949F', border: 'rgba(87, 82, 121, 0.3)', graph: ['#F2E9E1', '#D9C0B6', '#C0978B', '#A86E60', '#B4637A'] },
	CITY_LIGHTS: { isDark: true, background: '#1D252C', accent: '#A0B3C5', accentFaded: '#70A5EB', text: '#5CCFE6', border: 'rgba(160, 179, 197, 0.3)', graph: ['#2C3E50', '#3E5878', '#5072A0', '#628CC8', '#70A5EB'] },
	SYNTHWAVE84: { isDark: true, background: '#2B213A', accent: '#F5F5F5', accentFaded: '#FF6B97', text: '#FAD000', border: 'rgba(245, 245, 245, 0.3)', graph: ['#602260', '#802280', '#A020A0', '#C020C0', '#FF6B97'] },
	ONE_DARK: { isDark: true, background: '#282C34', accent: '#ABB2BF', accentFaded: '#E06C75', text: '#98C379', border: 'rgba(171, 178, 191, 0.3)', graph: ['#3E4451', '#51607A', '#657CA3', '#7998CC', '#61AFEF'] },
	MATERIAL: { isDark: true, background: '#263238', accent: '#ECEFF1', accentFaded: '#FF5370', text: '#C3E88D', border: 'rgba(236, 239, 241, 0.3)', graph: ['#37474F', '#4E6173', '#657B97', '#7C95BB', '#82AAFF'] },
	TOKYO_NIGHT: { isDark: true, background: '#1A1B26', accent: '#C0CAF5', accentFaded: '#F7768E', text: '#9ECE6A', border: 'rgba(192, 202, 245, 0.3)', graph: ['#24283B', '#38446A', '#4C6099', '#607CC8', '#7AA2F7'] }
};

export const syntaxThemes = {
	dracula: {
		_default: '#f8f8f2',
		background: '#282a36',
		'': '#bd93f9',
		'function-variable function': '#50fa7b',
		comment: '#6272a4',
		constant: '#bd93f9',
		'string-property property': '#f1fa8c',
		string: '#f1fa8c',
		variable: '#ff79c6',
		'template-punctuation string': '#f1fa8c',
		'interpolation-punctuation punctuation': '#f8f8f2',
		interpolation: '#f8f8f2',
		parameter: '#FFB86C',
		function: '#50fa7b',
		punctuation: '#f8f8f2',
		'regex-flags': '#ff79c6',
		'regex-delimiter': '#ff5555',
		'regex-source language-regex': '#bd93f9',
		'class-name': '#8be9fd',
		operator: '#ff79c6',
		keyword: '#ff79c6',
		'attr-name': '#ff79c6',
		number: '#bd93f9',
		boolean: '#bd93f9',
		tag: '#ff79c6',
		important: '#ff5555',
		selector: '#50fa7b',
		entity: '#f8f8f2',
		'variable.language': '#ff79c6',
		'literal-property property': '#f8f8f2'
	},
	synthwave84: {
		_default: '#ff7ed5',
		background: '#262335',
		'': '#ff7ed5',
		'function-variable function': '#72f1b8',
		comment: '#8e8e8e',
		constant: '#ff7ed5',
		'string-property property': '#f87c32',
		string: '#f87c32',
		variable: '#67cdcc',
		'template-punctuation string': '#f87c32',
		'interpolation-punctuation punctuation': '#ff7ed5',
		interpolation: '#f87c32',
		parameter: '#f4eee4',
		function: '#fdfdfd',
		punctuation: '#ccc',
		'regex-flags': '#f87c32',
		'regex-delimiter': '#e2777a',
		'regex-source language-regex': '#e2777a',
		'class-name': '#fff5f6',
		number: '#e2777a',
		boolean: '#fdfdfd',
		operator: '#67cdcc',
		keyword: (text) => (text === 'const' ? '#c8d25d' : '#66f19b'),
		'attr-name': '#e2777a',
		tag: '#e2777a',
		important: '#f4eee4',
		selector: '#72f1b8',
		entity: '#67cdcc',
		'variable.language': '#67cdcc',
		'literal-property property': '#f87c32'
	}
};


export const stickerPalettes = [
	['#047af6', '#7401df', '#202532', '#32fa00', '#ff00d5'],
	['#4db1c3', '#046084', '#35b07e', '#f0a7aa', '#e74758'],
	['#ffffff', '#f7a9ef', '#f881ec', '#f751e6', '#c400b0'],
	['#ffaf39', '#ee7e1b', '#ef421b', '#cf214b', '#bf1679'],
	['#86ff5d', '#34e361', '#14d285', '#0ebb9b', '#0c9ea9'],
	['#e0f4ff', '#cbecff', '#afe2ff', '#afd5ff', '#afc8ff'],
	['#d2dbde', '#8debff', '#84b7ff', '#b8b8b8', '#08e1ff'],
	['#ffef2b', '#2f4af4', '#ee1c62', '#33ee87', '#6cfcff'],
	['#6500ff', '#ffe04e', '#8b00ff', '#bd93ed', '#7400ff']
];


export const stickerFonts = ['chevin', 'texgy', 'sanspro', 'calm', 'impact', 'coolvetica', 'ibm'];

export const DEFAULT_STICKER_FONT = 'chevin';
