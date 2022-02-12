import { lookup } from "mime-types";
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
