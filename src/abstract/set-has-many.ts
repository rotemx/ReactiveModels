//region imports
import {Model} from "./Model";
import {json} from "../utils/jsonify";
import {proxyHandlerFactory} from "../utils/proxy-handler-factory";

//endregion


export function setHasMany(this: Model<any>): void {
	for (const {Class, key} of this.Class.hasMany || []) {
		(() => {
			const handler = {
				get: (target, property) => {
					return target[property];
				},
				set: (target, property, value, receiver) => {
					target[property] = value;
					this._hasMany[key] = (<Model<any>[]>target[property]).map(model => model._id);
					if (!(Array.isArray(target) && property === 'length')) { //dont need to update the DB twice for the LENGTH property of the array
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
				set       : (models: Model<any>[]) => {
					if (!Array.isArray(models)) {
						throw new Error(`HasMany: Value ${json(models)} must be an array.`)
					}
					this._hasMany[key] = models.map(m => m._id)

					models.forEach(child_model => {
						const parent = {
							_id            : this._id,
							key,
							collection_name: this.Class.collection_name
						};

						child_model._parents.push(parent)
					});
					proxy = new Proxy(models, handler);
					this.update({_hasMany: this._hasMany})
				}
			})
		})();
	}
}
