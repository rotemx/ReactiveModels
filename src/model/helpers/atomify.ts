import {Entity} from "../..";
import {ATOMIC} from "./model-helpers";

export const atomify: (promise: Promise<any>) => Promise<any> = promise => {
	if (Entity[ATOMIC]) {
		Entity.promises.push(promise)
	}
	return promise
}
