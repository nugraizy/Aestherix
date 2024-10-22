const defaultProperties = {
	name: 'required',
	minifiedDescription: 'optional',
	description: 'optional',
	category: 'required',
	usage: 'optional',
	aliases: 'optional',
	cooldown: 'optional',
	limit: 'optional',
	status: 'required',
	premium: 'optional'
};

export const isMissingProperty = (data) => {
	const missingRequiredProps = [];
	const missingOptionalProps = [];

	for (const props in defaultProperties) {
		const dataProps = data[props];
		if (!(props in data) && (defaultProperties[props] === 'required' || defaultProperties[props]?.[0] === 'required')) {
			missingRequiredProps.push(props);
		} else if (!dataProps && typeof dataProps !== 'string') {
			missingOptionalProps.push(props);
		}
	}

	if (missingRequiredProps.length > 1) {
		return {
			status: false,
			shouldStop: true,
			message: `Missing ${missingRequiredProps.map((prop) => `'${prop}'`).join(', ')}. Could not proceed.`
		};
	}

	if (missingOptionalProps.length > 1) {
		return {
			status: false,
			shouldStop: false,
			message: `Missing ${missingOptionalProps.map((prop) => `'${prop}'`).join(', ')}. Proceed with caution.`
		};
	}

	return { status: true };
};
