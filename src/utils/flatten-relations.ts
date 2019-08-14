import {Model} from "../abstract/Model";

export function flattenRelations<T extends Model<T>>(this: Model<T>, data: Partial<Model<T>>) {
	const _data = {...data};

	[...Object.keys(this._hasMany), ...Object.keys(this._hasOnes)]
		.filter(key=>_data[key] !== undefined)
		.map(key=>delete _data[key])

	return _data
}
