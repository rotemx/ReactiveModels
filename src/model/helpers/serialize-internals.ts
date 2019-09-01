//region imports
import {Model} from "../model";
import {IModelInternals} from "../types/i-model-internals";
import {INT} from "./model-helpers";
//endregion

type InternalKey = keyof IModelInternals;
type InternalsDict = { [key in InternalKey]?: any };

const EXCLUDED: (InternalKey)[] = ['values']

export function serializeInternals(model: Model<any>): InternalsDict {
	const
		data: InternalsDict        = {},
		Internals: IModelInternals = model[INT];

	Object.keys(Internals)
		.filter(key => !EXCLUDED.includes(<InternalKey>key))
		.forEach(key => data[`__${key}__`] = Internals[key])
	return data

}
