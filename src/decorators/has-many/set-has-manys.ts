//region imports
import {json} from "../../utils/jsonify";
import {INT} from "../../model/helpers/model-helpers";
import {Class} from "../../model/types/class";
import {IModelInternals} from "../../model/types/i-model-internals";
import {Model} from "../../model/model";
import {AnyFunction, ARRAY_FUNCTIONS, ArrayMethod, isIndex} from "./helpers";
//endregion

export const ROOT = Symbol('root')

class RootedModelArray<T extends Model<T> = any> extends Array<Model<T>> {
	[ROOT]?: Model<T>
}


function setHasMany<T extends Model<T>>(UserClass: Class, key: string) {

	const
		removeParents                     = (array: RootedModelArray) => {
			array.forEach(m => m.removeParent(array[ROOT], key));
		},
		addParents                        = (array: RootedModelArray) => {
			array.forEach(model => model.addParent(array[ROOT], key));
		},
		updateHasMany                     = (array: RootedModelArray) => {
			const
				root                       = array[ROOT],
				Internals: IModelInternals = root[INT];

			Internals.hasManys[key] = array.map(m => m._id);
			root.updateInternals("hasManys")
		},
		syncParents                       = (old_array: RootedModelArray, new_array: RootedModelArray) => {
			old_array.forEach(m => {
				if (!new_array.includes(m)) {
					m.removeParent(new_array[ROOT], key)
				}
			})
			new_array.forEach(m => {
				if (!old_array.includes(m)) {
					m.addParent(new_array[ROOT], key)
				}
			})
		},
		handler: ProxyHandler<Model<T>[]> = {

			deleteProperty: (array, index: number) => {
				const
					value = array[index];

				if (value && value instanceof Model) {
					value.removeParent(array[ROOT], key)
				}
				array.splice(index, 1)
				return true
			},
			get           : function (new_array: RootedModelArray, property) {
				if (typeof new_array[property] === "function" &&
					ARRAY_FUNCTIONS.includes(<ArrayMethod>property)) {

					const original_method: AnyFunction = <any>new_array[property]
					return (...args: any[]) => {
						const old_array = [...new_array];
						original_method.apply(new_array, args)
						updateHasMany(new_array)

						syncParents(old_array, new_array)
					}
				}
				return new_array[property];
			},
			set           : (array: RootedModelArray, prop: string | number | symbol, value: Model<T> | number, receiver: any): boolean => {
				const root: Model<T> = array[ROOT];

				if (prop === 'length' && typeof value === "number") {
					for (let i = value; i < array.length; i++) {
						array[i].removeParent(root, key)
					}
				} else if (typeof prop === "symbol") {

				} else if (isIndex(prop)) {
					if (!(value instanceof Model)) {
						throw new Error(`A hasMany value must be an instance of Entity. value received: ${json(value)} `)
					}
					if (!value.Class.__reactive__) {
						throw new Error(`Value ${json(value)} of class ${value.Class.name} is not an Entity. Did you forget to call the @Entity() decorator?`)
					}

					const old_value: Model<T> = array[prop];
					if (old_value) {
						old_value.removeParent(root, key)
					}

					value.addParent(root, key)
				} else {
					throw new Error(`${String(prop)} is not an index.`)
				}
				array[prop] = value
				updateHasMany(array)
				return true;
			}
		}


	Object.defineProperty(UserClass.prototype, key, {
		enumerable: true,
		get       : function () {
			return this[INT].values[key]
		},
		set       : function (new_array: Model<T>[]) {
			if (!Array.isArray(new_array)) {
				throw new Error(`HasMany: Value ${json(new_array)} is not an array.`)
			}
			if (!new_array.every(model => (model instanceof Model) && model.Class.__reactive__)) {
				throw new Error(`HasMany: Value ${json(new_array)} contains non-ReactiveModel values.`)
			}

			const
				Internals: IModelInternals  = this[INT],
				old_array: RootedModelArray = [...(this[key] || [])];

			new_array[ROOT] = this;
			old_array[ROOT] = this;
			updateHasMany(new_array)
			Internals.values[key] = new Proxy<RootedModelArray>(new_array, handler);

			syncParents(old_array, new_array)
		}
	})
}


export function setHasManys<T extends Model<T>>(UserClass: Class): void {
	Object
		.keys(UserClass.hasManys)
		.forEach(key => setHasMany(UserClass, key))
}
