//region imports
import {Model} from "./Model";
import {json} from "../utils/jsonify";

//endregion

export function setHasMany(this: Model<any>): void {
    for (const {Class, key} of this.Class.hasMany || []) {
        (() => {

            let
	            ref,
                handler = {
                    get: (target, property) => {
                        return target[property];
                    },
                    set: (target, property, value, receiver) => {
                        target[property] = value;
                        this.update({[key]: target})
                        // you have to return true to accept the changes
                        return true;
                    }
                },
                proxy = new Proxy([], handler);


            Object.defineProperty(this, key, {
                enumerable: true,
                get       : () => proxy,
                set       : (models: Model<any>[]) => {
                    if (!Array.isArray(models)) {
                        throw new Error(`HasMany: Value ${json(models)} must be an array.`)
                    }

                    // const ref_prop_name = `__${key}__.$hasManyRef`;
                    // ref = this[ref_prop_name] = models.map(model => model._id);

                    models.forEach(child_model => {
                        const parent = {
                            _id            : this._id,
                            key,
                            collection_name: this.Class.collection_name
                        };

                        child_model._parents.push(parent)
                    });
                    proxy = new Proxy(models, handler);

                    if (this.Class.auto_update_DB) {
                        this.update({[key]: json(ref)})
                    }
                }
            })
        })();
    }
}
