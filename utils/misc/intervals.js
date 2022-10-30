import dayjs from 'dayjs';

import configuration from '../../connect.js';

export const SetIntervals = async (intervaly, key, time, callback, opts = {}) => {
	const starts = new Date().getTime();
	const ends = dayjs(starts).add(parseInt(time), 'seconds').valueOf();

	intervaly.set(key, {
		timer: null,
		startsTimestamp: starts,
		endsTimestamp: ends,
		startsReadable: dayjs(starts).format('HH:mm:ss DD/MM'),
		endsReadable: dayjs(ends).format('HH:mm:ss DD/MM'),
		intervals: setInterval(callback, 1000),
		...opts,
	});
};

export const CheckIntervals = (intervaly) => {
	if (intervaly == undefined) {
		return 0;
	}

	return {
		...intervaly,
	};
};

export const CheckAllIntervals = () => {
	const result = [];

	for (const type in configuration.intervals) {
		result.push({
			[type]: Array.from(configuration.intervals[type].entries()).map(([key, value]) => ({
				[key]: value,
			})),
		});
	}

	return result;
};

export const DeleteIntervals = (intervaly, rawIntervaly, key) => {
	if (intervaly == undefined) {
		return 0;
	}

	clearInterval(intervaly.intervals);
	rawIntervaly.delete(key);
};
