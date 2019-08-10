//region imports
import {UserClass} from "../entity";
import {Model} from "../abstract/model";
import {Log} from "../utils/log";
//endregion

export const hasOne = (
    base: Model<any>,
    key: string
): any => {

    const
        Class = <UserClass>base.constructor,
        type = Reflect.getMetadata("design:type", base, key);

    Log(`Setting HasOne key ${key} with type ${type.name}`);
    Class.hasOnes = Class.hasOnes || [];
    Class.hasOnes.push({key, UserClass: type})
}

