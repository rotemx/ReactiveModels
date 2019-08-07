import {decycle} from "json-cyclic"
import {EntityBase} from "../abstract/entity-base";
import {field} from "../decorators/field-decorator";

const EXCLUDES = ['save', 'insert', 'delete', 'db', 'auto_update_DB', 'collection_name', 'fields'];


function isPrimitive(test) {
    return (test !== Object(test));
};

export const serializeData = <T extends EntityBase<T>>(data: Partial<T>) => {

    if ((typeof data !== 'object')) throw new Error(`serializer: this ain't an object`)

    let obj:Partial<T> = {}

    for (const key in data) {
        let value = data[key];
        if (typeof value === 'function' || EXCLUDES.includes(key)) {
            continue
        }
        obj[key] = isPrimitive(value) ? value : decycle(value)
    }
    return obj
}
