export function newSpliceFunc(pos) {
	return (chars) => chars.slice(pos);
}

export function newSwapFunc(arg) {
	return (chars) => {
		const pos = arg % chars.length;
		const tmp = chars[0];

		chars[0] = chars[pos];
		chars[pos] = tmp;
		return chars;
	};
}

export function reverseFunc(chars) {
	return chars.reverse();
}
