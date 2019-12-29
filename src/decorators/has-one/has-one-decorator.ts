//region imports
import {Class}  from "../../model/types/class";
import {Model}  from "../../model/model";
import {Entity} from "../..";
//endregion

export const hasOne = (
	base: Model,
	key: string
): void => {
	const
		Class       = <Class>base.constructor,
		child_Class = Reflect.getMetadata("design:type", base, key);
	
	console.log(`Setting HasOne key ${key} with type ${child_Class.name}`);
	Class.hasOnes = Class.hasOnes || {};
	Class.hasOnes[key] = child_Class;
}
