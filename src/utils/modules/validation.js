export const isURL = (input) => /^(https?:\/\/)([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(:[0-9]{2,5})?(\/\S*)?$/i.test(input);

export const isYoutubeURL = (input) =>
	/(?:http(?:s|):\/\/|)(?:(?:www\.|)youtube(?:-nocookie|)\.com\/(?:shorts\/)?(?:watch\?.*(?:|&)v=|embed\/|v\/)|youtu\.be\/)?\/.+/.test(
		input
	);

export const parseCode = (input) => {
	const parse = input.match(/([-_0-9a-zA-Z]{11})/);

	return parse === null ? false : parse[0];
};

export const isFilePath = (file) => /^(?:[a-z]:\\|\/|\.)/i.test(file);
