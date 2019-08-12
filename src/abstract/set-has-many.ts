//region imports
import {Model} from "./model";
import {json} from "../utils/jsonify";

//endregion

export function setHasMany(this: Model<any>): void {
    for (const {Class, key} of this.Class.hasMany || []) {
        (() => {

            let
                ids: string[],
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
                    if (!Array.isArray(models) || !models.every(inst => inst instanceof Class)) {
                        throw new Error(`Value ${json(models)} is not an array of instances of ${Class.name}.`)
                    }

                    ids = models.map(model => model._id);

                    models.forEach(child_model => {
                        const parent = {
                            _id            : this._id,
                            key,
                            collection_name: this.Class.collection_name
                        };

                        child_model.parents.push(parent)
                    });
                    proxy = new Proxy(models, handler);

                    if (this.auto_update_DB) {
                        console.log(`Upserting class ${this.Class.name} with hasMany ${key} value ${json(ids)}`);
                        this.update({[key]: json(ids)})
                    }
                }
            })
        })();
    }
}
