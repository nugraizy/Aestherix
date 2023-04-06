export const roundedRectData = (w, h, tlr, trr, brr, blr) =>
	`M 0 ${tlr} A ${tlr} ${tlr}  0 0 1 ${tlr}  0 L ${w - trr} 0 A ${trr} ${trr} 0 0 1 ${w} ${trr} L ${w} ${
		h - brr
	} A ${brr} ${brr} 0 0 1 ${w - brr} ${h} L ${blr} ${h} A ${blr} ${blr} 0 0 1 0 ${h - blr} Z`;

export const colors = {
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
		'interpolation-punctuation punctuation': '#ff79c6',
		interpolation: '#f8f8f2',
		parameter: '#50fa7b',
		function: '#50fa7b',
		punctuation: {
			opacity: 0.7,
			color: '#f8f8f2'
		},
		'regex-flags': '#ff79c6',
		'regex-delimiter': '#ff5555',
		'regex-source language-regex': '#50fa7b',
		'class-name': '#8be9fd',
		number: '#ff79c6',
		boolean: 'white',
		operator: '#bd93f9',
		keyword: '#ff79c6'
	}
};
