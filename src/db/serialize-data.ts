//region imports
import {decycle} from "json-cyclic"
import {Model} from "../model/model";
import {isPrimitive} from "../utils/is-primitive";
//endregion

const EXCLUDES = ['save', 'insert', 'delete', 'db', 'auto_update_DB', 'collection_name', 'fields', '_is_loading'];


export const serializeData = <T extends Model<T>>(data: Partial<T>) => {

	if ((typeof data !== 'object')) throw new Error(`serializer: this ain't an object`)

	let obj: Partial<T> = {}

	for (const key in data) {
		let value = data[key];
		if (
			typeof value === 'function' ||
			value instanceof Map ||
			EXCLUDES.includes(key) ||
			typeof data[key] === 'undefined') {
			continue
		}
		obj[key] = value
	}
	return obj
}
