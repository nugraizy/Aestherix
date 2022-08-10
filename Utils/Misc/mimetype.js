import { extension as extensi, lookup } from "mime-types";

export const mime = (input) => {
	switch (input) {
		case "mp3":
			return "audio/mpeg";
		case "ogg":
			return "audio/ogg";
		case "wav":
			return "audio/wav";
		case "opus":
			return "audio/opus";
		default:
			return lookup(input) || "application/octet-stream";
	}
};

export const extension = (input) => {
	switch (input) {
		case "audio/mpeg":
			return "mp3";
		case "audio/ogg":
			return "ogg";
		case "audio/wav":
			return "wav";
		case "audio/opus":
			return "opus";
		default:
			return extensi(input) || "mp3";
	}
};
