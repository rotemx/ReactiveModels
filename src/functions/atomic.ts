import {Entity} from "..";
import {ATOMIC} from "../model/helpers/model-helpers";

export function atomic<T>(fn: () => T): Promise<T> {
	Entity[ATOMIC] = true;
	const value = fn()
	return Promise
		.all(Entity.promises)
		.then(() => {
			Entity.promises.length = 0;
			return value
		})
}
