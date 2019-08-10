import {Model} from "./model";
import {isPrimitive} from "../utils/serialize-data";

const PRIMITIVES = [
    null,
    undefined,
    Number,
    BigInt,
    String,
    Symbol
]

export function setFields(this: Model<any>): void {
    for (const {key, type} of this.Class.fields) {
        (() => {
            let
                mode: 'primitive' | 'object' = 'primitive',
                primitive_value;

            let
                handler = {
                    get: (target, property) => {
                        return target[property];
                    },
                    set: (target, property, value, receiver) => {
                        console.log('setting ' + property + ' for ' + target + ' with value ' + value);
                        target[property] = value;
                        this.update({[key]: target})
                        // you have to return true to accept the changes
                        return true;
                    }
                },
                proxy;


            Object.defineProperty((this), key, {
                enumerable: true,
                get       : () => {
                    return mode === "primitive" ? primitive_value : proxy
                },
                set       : (value) => {
                    const class_name = this.Class.name;
                    if (isPrimitive(value)) {
                        primitive_value = value;
                        mode = "primitive"
                    } else {
                        mode = "object"
                        proxy = new Proxy(value, handler);
                    }


                    if (this.auto_update_DB) {
                        console.log(`Upserting class ${class_name} with key ${key} value ${value}`);
                        this.update({[key]: value})
                    }
                }
            })
        })();
    }
}
