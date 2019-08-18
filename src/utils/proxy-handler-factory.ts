type ProxyHandlerFn = (key: string, updateFn: (data: { [key: string]: any }) => void) => { get: (target:{[key:string]:any}, property:string) => any, set: (target:any, property:string, value:any, reciever:any) => any };

export const proxyHandlerFactory: ProxyHandlerFn =
	             (key, updateFn) => {
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
