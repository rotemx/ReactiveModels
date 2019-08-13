//region imports
import {Model} from "./Model";
import {json} from "../utils/jsonify";

//endregion

export function setHasOnes(this: Model<any>): void {
    for (const {Class, key} of this.Class.hasOnes || []) {
        (() => {
            let child_id;

            Object.defineProperty(this, key, {
                enumerable: true,
                get       : () => {
                    return child_id ? Class.get(child_id) : undefined
                },
                set       : (child_Model: Model<any> | string) => {

                    if (typeof child_Model === 'string') {
                        child_id = child_Model;
                    } else if (child_Model instanceof Class) {
                        child_id = child_Model._id;
                        child_Model._parents.push({
                            _id            : this._id,
                            key,
                            collection_name: this.Class.collection_name
                        })
                        if (this.Class.auto_update_DB) {
                            this.update({[key]: child_id})
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
