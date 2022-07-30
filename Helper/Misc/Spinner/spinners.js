import { readJSON } from "../../Modules/functions.js";

export const getSpinner = (spinner) => {
	const spinners = readJSON("./Helper/Misc/Spinner/spinners.json");
	return spinners[spinner] || spinners["dots"];
};
