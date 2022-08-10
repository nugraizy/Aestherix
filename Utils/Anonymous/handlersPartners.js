export const handlers = (key) => {
	const status = anonymous.get(key) || Array.from(anonymous.values()).find((k) => k.partner == key) || undefined;
	if (status == undefined) return false;
	return anonymous.has(key)
		? { partner1: key, partner2: anonymous.get(key).partner }
		: {
				partner1: anonymous.get(Array.from(anonymous.keys()).find((k) => anonymous.get(k).partner == key)).partner,
				partner2: Array.from(anonymous.keys()).find((k) => anonymous.get(k).partner == key),
		  };
};
