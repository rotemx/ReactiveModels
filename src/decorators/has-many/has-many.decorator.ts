//region imports
import {Class} from "../../model/types/class";
import {Model} from "../../model/model";
//endregion

export const hasMany = (
	base: Model,
	key: string
): any => {

	const
		Class = <Class>base.constructor,
		Type  = Reflect.getMetadata("design:type", base, key);

	if (Type !== Array) {
		throw new Error(`A hasMany type must be an array of Models. Actual type is ${Type.name}`)
	}

	console.log(`Setting HasMany key ${key} with type ${Type.name}`);
	Class.hasManys = Class.hasManys || {};
	Class.hasManys[key] = {collection_name:null}
	
}

