//region imports
import {Model} from "./Model";
import {json} from "../utils/jsonify";

//endregion

export function setHasOnes(this: Model<any>): void {
	for (const {Class, key} of this.Class.hasOnes || []) {
		(() => {

			Object.defineProperty(this, key, {
				enumerable: true,
				get       : () => {
					if (this._hasOnes[key])
					{
						let results = Class.get(this._hasOnes[key]);
						if (results.length)
						{
							return results[0]
						}
						else {
							throw new Error(`hasOne model with key ${key} is not found on class ${Class.name}`)
						}
					}
					return
				},
				set       : (child: Model<any>) => {

					if (!(child instanceof Class)){
						throw new Error(`Value ${json(child)} is not an instance of ${Class.name}.`)
					}
					this._hasOnes[key] = child._id;
					child._parents.push({
						_id            : this._id,
						key,
						collection_name: this.Class.collection_name
					})
					this.update({_hasOnes: this._hasOnes})
				}
			})
		})();
	}
}
