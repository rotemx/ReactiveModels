//region imports
import {Model} from "../../model/Model";
import {json} from "../../utils/jsonify";
import {densifyArray} from "../utils/densifyArray";

const ARRAY_FUNCTIONS = ['push', 'pop', 'shift', 'upshift', 'splice', 'copyWithin', 'fill', 'reverse', 'sort']

//endregion


export type AnyFunction = (...args: any[]) => any;

const isIndex = (prop:string) => !isNaN(+prop);

export function setHasMany<T extends Model<T>>(this: Model<T>): void {
	for (const key of Object.keys(this.Class.hasManys || [])) {
		(() => {

			const
				removeChildren = (array: Model<T>[]) => {
					array.forEach(model => model.removeParent(this, key));
				},
				addChildren    = (array: Model<T>[]) => {
					array.forEach(model => model.addParent(this, key));
				},
				updateHasMany  = (array: Model<T>[]) => {
					this._hasManys[key] = (<Model<any>[]>array).map(model => model._id);
					return this.update({_hasManys: this._hasManys})
				},
				handler:ProxyHandler<Model<T>[]>        = {

					deleteProperty: (array, index:number) => {
						const value = array[index];
						if (value && value instanceof Model) {
							value.removeParent(this, key)
						}
						delete array[index]
						this[key] = densifyArray(array)
						updateHasMany(this[key])
						return true
					},
					get           : (array: Model<T>[], property) => {
						if (ARRAY_FUNCTIONS.includes(<string>property)) {
							const original_method: AnyFunction = <any>array[property]
							return (...args: any[]) => {
								array.forEach(m => m.removeParent(this, key))
								original_method.apply(array, args)
								updateHasMany(array)
								addChildren(array)
							}
						}
						return array[property];
					},
					set           : (array, prop: string, value: Model<T> | number, receiver:any): boolean => {
						if (prop === 'length' && typeof value === "number") {
							for (let i = value; i < array.length; i++) {
								(<Model<T>>array[i]).removeParent(this, key)
							}
							array[prop] = value
						} else if (isIndex(prop)) {
							if (!(value instanceof Model)) {
								throw new Error(`A hasMany value must be an instance of Model. value received: ${json(value)} `)
							}
							if (!value.Class.__entity__) {
								throw new Error(`Value ${json(value)} of class ${value.Class.name} is not an entity. Did you forget to call the @Entity() decorator?`)
							}

							const old_value = <Model<T>>array[prop];
							if (old_value) {
								old_value.removeParent(this, key)
							}
							array[prop] = value
							value.addParent(this, key)
						} else {
							throw new Error(`A hasMany value must be an instance of Model. value received: ${json(value)} `)
						}
						updateHasMany(array);
						return true;
					}
				}

			let proxy = new Proxy([], handler);

			Object.defineProperty(this, key, {
				enumerable: true,
				get       : () => proxy,
				set       : (array: Model<T>[]) => {
					if (!Array.isArray(array)) {
						throw new Error(`HasMany: Value ${json(array)} must be an array.`)
					}
					if (!array.every(model => (model instanceof Model) && model.Class.__entity__)) {
						throw new Error(`HasMany: Value ${json(array)} contains non-entity values.`)
					}

					this._hasManys[key] = array.map(m => m._id);
					const old_array = this[key] as Model<any>[];
					old_array.forEach(model => model.removeParent(this, key))

					array.forEach(child => child.addParent(this, key));

					proxy = new Proxy<Model<T>[]>(array, handler);
					this.update({_hasManys: this._hasManys})
				}
			})
		})();
	}
}
