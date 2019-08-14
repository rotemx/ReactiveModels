//region imports
import {Class} from "../types/types/class";
import {Model} from "../abstract/Model";
import {Log} from "../utils/log";
//endregion

export const hasOne = (
	base: Model<any>,
	key: string
): void => {
	const
		parent_Class = <Class>base.constructor,
		child_Class  = Reflect.getMetadata("design:type", base, key);

	Log(`Setting HasOne key ${key} with type ${child_Class.name}`);
	parent_Class.hasOnes = parent_Class.hasOnes || [];
	parent_Class.hasOnes.push({key, Class: child_Class})
}
