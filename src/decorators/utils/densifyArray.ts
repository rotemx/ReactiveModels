export const densifyArray = arr => {
	const b = [];
	for (let i = 0; i < arr.length; i++) {
		if (arr[i] !== undefined && arr[i] !== null) {
			b.push(arr[i]);
		}
	}
	return b;
}
