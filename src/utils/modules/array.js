export const shuffleArray = (array = []) => {
	const arr = [...array];

	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));

		[arr[i], arr[j]] = [arr[j], arr[i]];
	}

	return arr;
};

export const randomize = (array = []) => array[Math.floor(Math.random() * array.length)];

export const removeDuplicatesArray = (array = []) => [...new Set(array)];

export const reverseArray = (array = []) => array.reverse();

export const closestNumberFromArray = (number, array = []) => {
	if (typeof number !== 'number') {
		number = Number(number);
	}

	return array.reduce((previous, current) => (Math.abs(current - number) < Math.abs(previous - number) ? current : previous));
};
