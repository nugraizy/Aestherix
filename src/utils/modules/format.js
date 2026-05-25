export const numberWithCommas = (number = 0, region = 'id') => parseInt(number).toLocaleString(region);

export const getFilesizeFromBytes = (bytes = 0) => {
	if (Number.isNaN(bytes)) {
		throw new Error('Not a Number');
	}

	if (Number(bytes) === 0) {
		return '0 B';
	}

	const size = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	const factor = Math.floor((String(bytes).length - 1) / 3);

	bytes = bytes / Math.pow(1024, factor);
	bytes = Math.floor(bytes * Math.pow(10, 2)) / Math.pow(10, 2);

	return String(bytes) + size[factor];
};

export const extractFilesize = (bytes = 0) => getFilesizeFromBytes(Buffer.byteLength(bytes));

export const formatViews = (s) => {
	const reg = /[A-Z]/g;
	const MULTIPLIER = {
		K: 1000,
		M: 1_000_000,
		B: 1_000_000_000,
		T: 1_000_000_000
	};
	const matrix = s.split('').findIndex((v) => Object.keys(MULTIPLIER).includes(v));

	if (matrix === -1) {
		return Number(s);
	}

	return Number(s.replace(reg, '')) * MULTIPLIER[s[matrix]];
};

export const formatNumber = (number) => {
	if (typeof number !== 'number') {
		throw new Error('Input must be a number');
	}

	if (number < 1000) {
		return String(number);
	}

	const units = ['K', 'M', 'B', 'T'];

	const unit = Math.floor((number.toFixed(0).length - 1) / 3) * 3;
	const value = (number / 10 ** unit).toFixed(1);

	return `${value}${units[unit / 3 - 1]}`;
};

export const formatBytes = (bytes, base = 1024, decimals = 2) => {
	if (!bytes) {
		return '0 B';
	}

	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(base));
	const value = (bytes / Math.pow(base, i)).toFixed(decimals);

	return `${value} ${sizes[i]}`;
};

export const speedText = (speed) => {
	let bits = speed * 8;
	const units = ['', 'K', 'M', 'G', 'T'];
	const places = [0, 1, 2, 3, 3];
	let unit = 0;

	while (bits >= 2000 && unit < 4) {
		unit++;
		bits /= 1000;
	}

	return `${bits.toFixed(places[unit])} ${units[unit]}bps`;
};

export const convertSecondstoTime = (ms) => {
	if (ms < 0) {
		ms = -ms;
	}

	const time = {
		day: Math.floor(ms / 86400000),
		hour: Math.floor(ms / 3600000) % 24,
		minute: Math.floor(ms / 60000) % 60,
		second: Math.floor(ms / 1000) % 60,
		millisecond: Math.floor(ms) % 1000
	};

	return Object.entries(time)
		.filter((val) => val[1] !== 0)
		.map((val) => val[1])
		.join(':');
};

export const convertToOrdinal = (number) => {
	const ordinal = ['th', 'st', 'nd', 'rd'];
	const lastTwoDigits = number % 100;

	return number + (ordinal[(lastTwoDigits - 20) % 10] || ordinal[lastTwoDigits] || ordinal[0]);
};
