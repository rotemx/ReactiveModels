import {Model} from "../../abstract/Model";

export function removeDeepRelations<T extends Model<T>>(this: Model<T>, data: Partial<Model<T>>) {
	const _data = {...data};

	[...Object.keys(this._hasManys), ...Object.keys(this._hasOnes)]
		.filter(key=>_data[key] !== undefined)
		.map(key=>delete _data[key])

	return _data
}
