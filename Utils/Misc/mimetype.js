import { lookup, extension as extensi } from "mime-types";

export function mime(input) {
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
}

export function extension(input) {
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
}
