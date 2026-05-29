export const parse = (str) => {
	const marker = 'window.__INITIAL_STATE__ = ';
	const idx = str.indexOf(marker);

	if (idx === -1) {
		return null;
	}

	const start = idx + marker.length;
	let j = start;

	if (str.slice(start).startsWith('JSON.parse("')) {
		j = start + 'JSON.parse("'.length;

		while (j < str.length) {
			if (str[j] === '\\') {
				j += 2;
				continue;
			}

			if (str[j] === '"') {
				break;
			}

			j++;
		}

		const expression = str.slice(start, j + 2);

		try {
			return new Function(`return ${expression}`)();
		} catch {
			return null;
		}
	}

	const end = str.indexOf(';', start);
	const expression = str.slice(start, end > 0 ? end : undefined);

	try {
		return JSON.parse(expression);
	} catch {
		return null;
	}
};
