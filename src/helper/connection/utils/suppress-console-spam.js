const originalWrite = process.stdout.write.bind(process.stdout);

process.stdout.write = (chunk, encoding, callback) => {
	const text = chunk.toString();

	if (text.includes('Removing old closed session') || text.includes('Closing session') || text.includes('Opening session')) {
		return true;
	}

	return originalWrite(chunk, encoding, callback);
};
