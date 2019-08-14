//region imports
import {decycle} from "json-cyclic"
import {Model} from "../abstract/Model";
//endregion

const EXCLUDES = ['save', 'insert', 'delete', 'db', 'auto_update_DB', 'collection_name', 'fields', 'is_loading'];


export function isPrimitive(test): boolean {
	return (test !== Object(test));
}

export const serializeData = <T extends Model<T>>(data: Partial<T>) => {

	if ((typeof data !== 'object')) throw new Error(`serializer: this ain't an object`)

	let obj: Partial<T> = {}

	for (const key in data) {
		let value = data[key];
		if (
			typeof value === 'function' ||
			EXCLUDES.includes(key) ||
			typeof data[key] === 'undefined') {
			continue
		}
		obj[key] = isPrimitive(value) ? value : decycle(value)
	}
	return obj
}
