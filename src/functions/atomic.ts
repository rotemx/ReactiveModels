import {Entity} from "..";
import {ATOMIC} from "../model/helpers/model-symbols";

export function atomic<T>(fn: () => T): Promise<T> {
	Entity[ATOMIC] = true;
	const value = fn()
	
	try {
		return Promise
			.all(Entity.promises || [])
			.then(() => {
				Entity.promises.length = 0;
				Entity[ATOMIC] = false;
				return value
			});
	} catch (e) {
		console.error('atomic() error');
		console.error(e);
		throw new Error(e)
	}
	
	
}
