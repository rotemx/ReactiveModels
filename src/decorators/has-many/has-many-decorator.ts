//region imports
import {Class} from "../../types/types/class";
import {Model} from "../../abstract/Model";
//endregion

export const hasMany = (
	base: Model<any>,
	key: string
): any => {

	const
		Class = <Class>base.constructor,
		type  = Reflect.getMetadata("design:type", base, key);

	if (type !== Array)
	{
		throw new Error(`A hasMany type must be an array of Models`)
	}

	console.log(`Setting HasMany key ${key} with type ${type.name}`);
	Class.hasManys = Class.hasManys || [];
	Class.hasManys.push({key, Class: type})
}

