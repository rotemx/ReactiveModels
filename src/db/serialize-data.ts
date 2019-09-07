//region imports
import {Model} from "../model/model";
import {FIELDS} from "../model/helpers/model-helpers";
//endregion

const EXCLUDED_PROPS = ['db', 'auto_update_DB', 'collection_name', 'fields', '_is_loading'];


export function serializeData(this: Model, data: Partial<Model>) {

	if ((typeof data !== 'object')) throw new Error(`serializer: this ain't an object`)

	const
		result: Partial<Model> = {};

	[...Object.entries(data)]
		.forEach(([key, value]: [string, any]) => {

			if (typeof value === 'function' ||
				value instanceof Map ||
				EXCLUDED_PROPS.includes(key) ||
				typeof data[key] === 'undefined') {
				return
			}

			if (['_id', '__parents__', '__fields__'].includes(key)) {
				result[key] = data[key]
			}
			else if ([
				...this.Class.fields.map(f => f.key),
				...Object.keys(this.Class.hasManys),
				...Object.keys(this.Class.hasOnes)
			].includes(key)) {
				const field = this[FIELDS][key]
				result[key] = (field.hasOne || field.hasMany) ? field.value : this[key]
			}
			else {
				throw new Error(`Trying to save key ${key} which is not a registered key of ${this.Class.name}`)

			}
		});

	return result
}
