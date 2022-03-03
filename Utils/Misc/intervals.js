import moment from "moment-timezone";

export const SetIntervals = async (intervaly, key, time, callback, opts = {}) => {
	const starts = new Date().getTime();
	const ends = moment(starts).add(parseInt(time), "seconds").valueOf();
	intervaly.set(key, {
		timer: null,
		startsTimestamp: starts,
		endsTimestamp: ends,
		startsReadable: moment(starts).format("HH:mm:ss DD/MM"),
		endsReadable: moment(ends).format("HH:mm:ss DD/MM"),
		intervals: setInterval(callback, 1000),
		...opts,
	});
};

export const CheckIntervals = (intervaly) => {
	const interval = intervaly;
	if (interval == undefined) return 0;
	return {
		...interval,
	};
};

export const CheckAllIntervals = () => {
	const result = [];
	for (const type in intervals) {
		result.push({
			[type]: Array.from(intervals[type].entries()).map(([key, value]) => ({
				[key]: value,
			})),
		});
	}
	return result;
};

export const DeleteIntervals = (intervaly, rawIntervaly, key) => {
	const interval = intervaly;
	if (interval == undefined) return 0;
	clearInterval(interval.intervals);
	rawIntervaly.delete(key);
};
