//region imports
import {Model} from "../../abstract/Model";
import {json} from "../../utils/jsonify";

//endregion

export function setHasOnes(this: Model<any>): void {
	for (const key of  Object.keys(this.Class.hasOnes || [])) {
		(() => {
			const Class = this.Class.hasOnes[key];

			if (!(Class instanceof (Model.constructor))) {
				throw new Error(`Type of hasOne property "${key}" in class "${this.Class.name}" is not an instance of Model. Did you forget to specify the type ?`)
			}
			Object.defineProperty(this, key, {
				enumerable: true,
				get       : () => {
					if (this._hasOnes[key]) {
						let results = Class.get(this._hasOnes[key]);
						if (results.length) {
							return results[0]
						} else {
							throw new Error(`hasOne model with key ${key} is not found on class ${Class.name}`)
						}
					}
					return null
				},
				set       : <T extends Model<T>>(child: Model<T>) => {
					if (!child) {
						delete this._hasOnes[key]
						const old_child = this[key];
						if (old_child && old_child instanceof Model) {
							old_child.removeParent(this, key)
						}

					} else {
						if (!(child instanceof Class || !(<Model<T>>child).Class.__entity__ )) {
							throw new Error(`Value ${json(child)} is not an instance of ${Class.name}. Did you forget to call the Entity() decorator?`)
						}
						this._hasOnes[key] = child._id;

						child.addParent(this, key)
					}
					return this.update({_hasOnes: this._hasOnes})
				}
			})
		})();
	}
}
