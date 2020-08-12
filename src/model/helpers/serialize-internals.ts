//region imports
import {Model} from "../model";
import {IFieldMap} from "../types/i-field-map";
import {FIELDS} from "./model-symbols";
//endregion

type InternalKey = keyof IFieldMap;
type InternalsDict = { [key in InternalKey]?: any };

const EXCLUDED: (InternalKey)[] = ['fields_config']

export function serializeInternals(model: Model): InternalsDict {
	const
		data: InternalsDict  = {},
		Internals: IFieldMap = model[FIELDS];

	Object.keys(Internals)
		.filter(key => !EXCLUDED.includes(<InternalKey>key))
		.forEach(key => data[`__${key}__`] = Internals[key])
	return data

}
