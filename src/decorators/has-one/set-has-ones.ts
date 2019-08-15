//region imports
import {Model} from "../../abstract/Model";
import {json} from "../../utils/jsonify";
import {setParent} from "../utils/set-parent";

//endregion

export function setHasOnes(this: Model<any>): void {
	for (const {Class, key} of this.Class.hasOnes || []) {
		(() => {

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
					return
				},
				set       : (child: Model<any>) => {

					if (!(child instanceof Class)) {
						throw new Error(`Value ${json(child)} is not an instance of ${Class.name}.`)
					}
					this._hasOnes[key] = child._id;

					setParent.call(this, child, key)
					this.update({_hasOnes: this._hasOnes})
				}
			})
		})();
	}
}
