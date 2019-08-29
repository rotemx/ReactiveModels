export type updateFn = (data: { [key: string]: any }) => void;


export function proxyFactory(value) {

}

export function proxyHandlerFactory(key:string, updateFn:updateFn) {
	return {
		get: (target, property) => {
			return target[property];
		},
		set: (target, property, value, receiver) => {
			target[property] = value;
			if (!(Array.isArray(target) && property === 'length')) { //dont need to update the DB twice for the LENGTH property of the array
				updateFn({[key]: target})
			}
			return true;
		}
	}
}
