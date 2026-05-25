export const clampFloat = (value) => (value > 1 ? 1 : value < -1 ? -1 : value);

export const distordFX = (value) => (value > 0 ? 1 : value < 0 ? -1 : 0);

export const clamp = (value, min, max) => Math.min(Math.max(min, value), max);

export const randomNumber = (max) => Math.floor(Math.random() * (max + 1));

export const generateHex = (length) =>
	[...Array(length)]
		.map(() => Math.floor(Math.random() * 16).toString(16))
		.join('')
		.toUpperCase();

export const getAverage = (nums) => (nums.reduce((a, b) => a + b) / nums.length).toFixed(2);

export const calcCrow = (lats1, lon1, lats2, lon2) => {
	const R = 6371;
	const dLat = lats2 - (lats1 * Math.PI) / 180;
	const dLon = lon2 - (lon1 * Math.PI) / 180;
	const lat1 = (lats1 * Math.PI) / 180;
	const lat2 = (lats2 * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return R * c;
};

export const unique = (minimum, maximum) => {
	let previousValue;

	return function random() {
		const number = Math.floor(Math.random() * (maximum - minimum + 1) + minimum);

		previousValue = number === previousValue && minimum !== maximum ? random() : number;

		return previousValue;
	};
};

export const veryUnique = (minimum, maximum) => {
	let usedValues = [];

	return function random() {
		if (usedValues.length === maximum - minimum + 1) {
			return null;
		}

		let number;

		do {
			number = Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
		} while (usedValues.includes(number));

		usedValues.push(number);
		return number;
	};
};

export const increment = (minimum, maximum) => {
	let currentValue = minimum;

	return function () {
		if (currentValue <= maximum) {
			const result = currentValue;

			currentValue++;
			return result;
		} else {
			return null;
		}
	};
};
