export const parse = (str) => {
	str = str.split('window.__INITIAL_STATE__ = ')[1].split(');')[0] + ')';
	str = eval(str);

	return str;
};
