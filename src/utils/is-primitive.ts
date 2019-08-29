export function isPrimitive(test: any): boolean {
	return (test !== Object(test));
}
