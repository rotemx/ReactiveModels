
export const logErr = (err: Error) => {
	console.error(err);
	return Promise.reject(err);
};
