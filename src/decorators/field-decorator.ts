import {EntityBase} from "../abstract/entity-base";

export const field = (
    target: any,
    key: string
): any => {
    target.constructor.fields = target.constructor.fields || [];
    target.constructor.fields.push(key)
}

