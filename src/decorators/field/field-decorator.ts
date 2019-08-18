//region imports
import {Class} from "../../types/types/class";
import {Model} from "../../model/Model";
//endregion

export const field = (
	base: Model<any>,
	key: string
): void => {

	const
		Class = <Class>base.constructor,
		Type  = Reflect.getMetadata("design:type", base, key);

	// Log(`Setting key ${key} with type ${Type.name}`);
	Class.fields = Class.fields || [];

	if (!Class.fields.find(f => f.key === key)) {
		Class.fields.push({key, type: Type})
	}
}

