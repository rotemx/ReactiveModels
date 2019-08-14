import {Model} from "../abstract/Model";

export function flattenRelations<T extends Model<T>>(this: Model<T>, data: Partial<Model<T>>) {
	const _data = {...data}
	/*
	 Object.keys(_data)
	 .filter(key => (this.Class.hasOnes || []).map(h => h.key).includes(key))
	 .forEach(key => {
	 return _data[key] && (_data[key] = _data[key]._id)
	 })

	 Object.keys(_data)
	 .filter(key => (this.Class.hasMany || []).map(h => h.key).includes(key))
	 .forEach(key => {
	 return _data[key] && (_data[key] = _data[key]
	 .map(model => model._id))})
	 */

	return _data
}
