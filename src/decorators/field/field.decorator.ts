//region imports
import {Class}  from "../../model/types/class";
import {Model}  from "../../model/model";
//endregion

export const field = (
	base: Model,
	key: string
): void => {
	
	const
		Class = <Class>base.constructor,
		Type  = Reflect.getMetadata("design:type", base, key);
	
	console.log(`Setting key ${key} with type ${Type.name}`);
	Class.fields_config = [...(Class.fields_config || []), {key, type: Type}];
	
	// Entity.config[Class.collection_name] = Entity.config[Class.collection_name] || {}
	// Entity.config[Class.collection_name].fields_config = [...(Entity.config[Class.collection_name].fields_config || []),  {key, type: Type}];
	
}
