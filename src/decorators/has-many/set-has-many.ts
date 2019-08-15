//region imports
import {Model} from "../../abstract/Model";
import {json} from "../../utils/jsonify";
import {setParent} from "../utils/set-parent";

//endregion


export function setHasMany(this: Model<any>): void {
	for (const {Class, key} of this.Class.hasManys || []) {
		(() => {
			const handler = {
				get: (target, property) => {
					return target[property];
				},
				set: (array, property, value, receiver) => {
					if (!(value instanceof Model) && property !== 'length') {
						throw new Error(`A hasMany value must be an instance of Model. value received: ${json(value)} `)
					}

					array[property] = value;
					this._hasMany[key] = (<Model<any>[]>array).map(model => model._id);
					if (!isNaN(+property) && value instanceof Model) {
						setParent.call(this, value, key)
					}

					if (!(Array.isArray(array) && property === 'length')) { //dont need to update the DB twice for the LENGTH property of the array
						this.update({_hasMany: this._hasMany})
					}
					return true;
				}
			}

			let
				proxy = new Proxy([], handler);

			Object.defineProperty(this, key, {
				enumerable: true,
				get       : () => proxy,
				set       : (array: Model<any>[]) => {
					if (!Array.isArray(array)) {
						throw new Error(`HasMany: Value ${json(array)} must be an array.`)
					}
					this._hasMany[key] = array.map(m => m._id)

					array.forEach(child => setParent.call(this, child, key));

					proxy = new Proxy(array, handler);
					this.update({_hasMany: this._hasMany})
				}
			})
		})();
	}
}
