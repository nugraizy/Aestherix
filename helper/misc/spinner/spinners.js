import { readJSON } from '../../modules/functions.js';

export const getSpinner = (spinner) => {
	const spinners = readJSON('./helper/misc/spinner/spinners.json');

	return spinners[spinner] || spinners['dots'];
};
