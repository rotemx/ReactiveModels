// import 'reflect-metadata'
import {UserClass} from "../entity";
import {Model} from "../abstract/model";
import {Log} from "../utils/log";

export const field = (
    base: Model<any>,
    key: string
): void => {

    const
        Class = <UserClass>base.constructor,
        type = Reflect.getMetadata("design:type", base, key);

    Log(`Setting key ${key} with type ${type.name}`);
    Class.fields = Class.fields || [];
    if (!Class.fields.find(f => f.key === key)) {
        Class.fields.push({key, type})
    }
}

