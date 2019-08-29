//region imports
import {Model} from "../..";
import {IModelInternals} from "../../model/types/i-model-internals";
import {INT} from "../../model/helpers/model-helpers";

//endregion

export function serializeRelationData<T extends Model<T>>(this: Model<T>, data: Partial<Model<T> & { _internals?: IModelInternals }>) {
	const
		_data = {...data},
		int:IModelInternals   = this[INT];

	[...Object.keys(int.hasManys), ...Object.keys(int.hasOnes)]
		.filter(key => _data[key] !== undefined)
		.map(key => delete _data[key])
	return _data
}
