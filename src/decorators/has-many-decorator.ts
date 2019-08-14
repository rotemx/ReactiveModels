//region imports
import {Class} from "../types/types/class";
import {Model} from "../abstract/Model";
//endregion

export const hasMany = (
	base: Model<any>,
	key: string
): any => {

	const
		Class = <Class>base.constructor,
		type  = Reflect.getMetadata("design:type", base, key);

	console.log(`Setting HasMany key ${key} with type ${type.name}`);
	Class.hasMany = Class.hasMany || [];
	Class.hasMany.push({key, Class: type})
}

