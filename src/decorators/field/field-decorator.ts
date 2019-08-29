//region imports
import {Class} from "../../model/types/class";
import {Model} from "../../model/model";
//endregion

export const field = (
	base: Model<any>,
	key: string
): void => {

	const
		Class = <Class>base.constructor,
		Type  = Reflect.getMetadata("design:type", base, key);

	console.log(`Setting key ${key} with type ${Type.name}`);
	Class.fields = Class.fields || [];

	Class.fields.push({key, type: Type})
}
