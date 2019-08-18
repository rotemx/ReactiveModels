//region imports
import {Class} from "../../types/types/class";
import {Model} from "../../model/Model";
//endregion

export const hasMany = (
	base: Model<any>,
	key: string
): any => {

	const
		Class = <Class>base.constructor,
		Type  = Reflect.getMetadata("design:type", base, key);

	if (Type !== Array)
	{
		throw new Error(`A hasMany type must be an array of Models`)
	}

	console.log(`Setting HasMany key ${key} with type ${Type.name}`);
	Class.hasManys = Class.hasManys || {};
	Class.hasManys[key] = Type
}

