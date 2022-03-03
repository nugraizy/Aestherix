import moment from "moment-timezone";

export const SetIntervals = async (key, time, type, callback) => {
	if (intervals[type] === undefined) throw new Error("Interval type not found");
	const starts = new Date().getTime();
	const ends = moment(starts).add(parseInt(time), "seconds").valueOf();
	intervals[type].set(key, {
		timer: null,
		startsTimestamp: starts,
		endsTimestamp: ends,
		startsReadable: moment(starts).format("HH:mm:ss DD/MM"),
		endsReadable: moment(ends).format("HH:mm:ss DD/MM"),
		intervals: setInterval(callback, 1000),
	});
};

export const CheckIntervals = (key, type) => {
	if (intervals[type] === undefined) throw new Error("Interval type not found");
	const interval = intervals[type].get(key);
	if (interval == undefined) return 0;
	return {
		timer: interval.timer,
		startsTimestamp: interval.startsTimestamp,
		endsTimestamp: interval.endsTimestamp,
		startsReadable: interval.startsReadable,
		endsReadable: interval.endsReadable,
		interval: interval.intervals,
	};
};

export const CheckAllIntervals = () => {
	const result = [];
	for (const type in intervals) {
		if (intervals[type] === undefined) throw new Error("Interval type not found");
		result.push({
			[type]: Array.from(intervals[type].entries()).map(([key, value]) => ({
				[key]: value,
			})),
		});
	}
	return result;
};

export const DeleteIntervals = (key, type) => {
	if (intervals[type] === undefined) throw new Error("Interval type not found");
	const interval = intervals[type].get(key);
	if (interval == undefined) return 0;
	clearInterval(interval.intervals);
	intervals[type].delete(key);
};
