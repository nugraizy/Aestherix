import fs from "fs";

export function getSpinner(spinner) {
	const spinners = JSON.parse(fs.readFileSync("./Helper/Misc/spinners.json"));
	return spinners[spinner] || spinners["dots"];
}
