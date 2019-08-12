//region imports
import {Model} from "./model";
import {json} from "../utils/jsonify";

//endregion

export function setHasOnes(this: Model<any>): void {
    for (const {Class, key} of this.Class.hasOnes || []) {
        (() => {
            let _id;

            Object.defineProperty(this, key, {
                enumerable: true,
                get       : () => {
                    return _id ? Class.get(_id) : null
                },
                set       : (child_Model: Model<any> | string) => {

                    if (typeof child_Model === 'string') {
                        _id = child_Model;

                    } else if (child_Model instanceof Class) {
                        _id = child_Model._id;
                        child_Model.parents.push({
                            _id            : this._id,
                            key,
                            collection_name: this.Class.collection_name
                        })
                        child_Model.save()
                        if (this.auto_update_DB) {
                            console.log(`Upserting class ${this.Class.name} with hasOne ${key} value ${child_Model._id}`);
                            this.update({[key]: _id})
                        }
                    }
                    else
                    {
                        throw new Error(`hasOne value ${json(child_Model)} is not an instance of ${Class.name} nor a string id. `)
                    }

                }

            })
        })();
    }
}
