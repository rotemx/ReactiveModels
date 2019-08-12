//region imports
import {Class} from "../types/types/class";
import {Model} from "../abstract/model";
import {Log} from "../utils/log";
//endregion

export const hasMany = (
    base: Model<any>,
    key: string
): any => {

    const
        Class = <Class>base.constructor,
        type = Reflect.getMetadata("design:type", base, key);

    Log(`Setting HasMany key ${key} with type ${type.name}`);
    Class.hasMany = Class.hasMany || [];
    Class.hasMany.push({key, Class: type})
}

