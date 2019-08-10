//region imports
import {Model} from "./model";
//endregion

export function setHasOnes(this: Model<any>): void {
    for (const {UserClass, key} of this.Class.hasOnes) {
        (() => {
            let _id;


            Object.defineProperty(this, key, {
                enumerable: true,
                get       : () => UserClass.instances.find(inst => inst._id === _id),
                set       : (instance: Model<any>) => {
                    if (!(instance instanceof UserClass)) {
                        throw new Error(`Value is not an instance of ${UserClass.name} `)
                    }

                    const class_name = this.Class.name;
                    _id = instance._id;
                    instance.isOneOf.push({
                        id:this._id,
                        key,
                        collection_name:this.Class.collection_name
                    })
                    instance.save()
                    if (this.auto_update_DB) {
                        console.log(`Upserting class ${class_name} with hasOne ${key} value ${instance._id}`);
                        this.update({[key]: _id})
                        instance
                    }
                }
            })
        })();
    }
}
