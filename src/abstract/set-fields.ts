//region imports
import {Model} from "./model";
import {isPrimitive} from "../utils/serialize-data";
import {Log} from "../utils/log";
import {proxyHandlerFactory} from "../utils/proxy-handler-factory";
//endregion



export function setFields(this: Model<any>): void {
    for (const {key, type} of this.Class.fields) {
        (() => {
            let
                mode: 'primitive' | 'object' = 'primitive',
                primitive_value,
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
                        proxy = new Proxy(value, proxyHandlerFactory(key, this.update ));
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
