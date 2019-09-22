//region imports
import {json}                                                                   from "../../utils/jsonify";
import {
	FIELDS,
	REACTIVE
}                                                                               from "../../model/helpers/model-helpers";
import {Class}                                                                  from "../../model/types/class";
import {IFieldInstance, IFieldMap, Primitive}                                   from "../../model/types/i-field-map";
import {Model}                                                                  from "../../model/model";
import {AnyFunction, ArrayMethod, INSTANCES, isIndex, MUTATING_ARRAY_FUNCTIONS} from "./helpers";

//endregion


function setHasMany(UserClass: Class, key: string) {
	
	const
		updateFieldMap                 = (array: Model[]) => {
			const This = INSTANCES.get(array);
			const fields: IFieldMap = This[FIELDS];
			
			fields[key] = {
				hasMany: true,
				value  : <Primitive>array.map(m => m._id),
				proxy  : new Proxy<Model[]>(array, handler),
				mode   : "proxy"
			};
			This.update(key)
		},
		syncParents                    = function (this: void, old_array: Model[], new_array: Model[]) {
			old_array.forEach(m => {
				if (!new_array.includes(m)) {
					m.removeParent(INSTANCES.get(new_array), key)
				}
			})
			new_array.forEach(m => {
				if (!old_array.includes(m)) {
					m.addParent(INSTANCES.get(new_array), key)
				}
			})
		},
		handler: ProxyHandler<Model[]> = {
			deleteProperty: (array, index: number) => {
				const
					value = array[index];
				
				if (value && value instanceof Model) {
					value.removeParent(INSTANCES.get(array), key)
				}
				array.splice(index, 1)
				return true
			},
			get           : (new_array: Model[], property) => {
				if (typeof new_array[property] === "function" &&
					MUTATING_ARRAY_FUNCTIONS.includes(<ArrayMethod>property)) {
					
					const original_method: AnyFunction = <any>new_array[property]
					return (...args: any[]) => {
						const old_array = [...new_array];
						original_method.apply(new_array, args)
						updateFieldMap(new_array)
						syncParents(old_array, new_array)
					}
				}
				return new_array[property];
			},
			set           : (array: Model[], prop: string | number | symbol, child: Model | number, receiver: any): boolean => {
				
				if (prop === 'length' && typeof child === "number") {
					for (let i = child; i < array.length; i++) {
						array[i].removeParent(INSTANCES.get(array), key)
					}
				}
				else if (typeof prop === "symbol") {
					//do nothing
				}
				else if (isIndex(prop)) {
					if (!(child instanceof Model)) {
						throw new Error(`@hasMany: @hasMany value must be an instance of Entity. Value received: ${json(child)} `)
					}
					if (!child.Class[REACTIVE]) {
						throw new Error(`@hasMany: Value ${json(child)} of class ${(child && child.Class && child.Class.name || 'Unknown')} is not an Entity. Did you forget to call the @Entity() decorator?`)
					}
					
					const old_child = array[prop];
					if (old_child) {
						old_child.removeParent(this, key)
					}
					
					if (this.Class.hasManys[key] && this.Class.hasManys[key].Class) {
						if (!([...array, child]).every(m => m.Class === this.Class.hasManys[key])) {
							throw new Error(`@hasMany: the child provided has a class of ${child.Class.name} whereas other members are of class ${this.Class.hasManys[key].name}`)
						}
					}
					else {
						this.Class.hasManys[key] = {Class: child.Class}
					}
					
					child.addParent(INSTANCES.get(array), key)
				}
				else {
					throw new Error(`${String(prop)} is not an index.`)
				}
				array[prop] = child
				updateFieldMap(array)
				return true;
			}
		}
	
	Object.defineProperty(UserClass.prototype, key, {
		enumerable: true,
		get       : function (this: Model) {  //Descriptor
			const field: IFieldInstance = this[FIELDS][key];
			if (!field) return
			
			if (!field.proxy) {
				const
					ids_array       = <string[]>field.value,
					child_Class     = this.Class.hasManys[key].Class,
					target: Model[] = ids_array.map(child_Class.get);
				
				INSTANCES.set(target, this)
				field.proxy = new Proxy<Model[]>(target, handler)
			}
			return field.proxy
		},
		set       : function (this: Model, new_array: Model[]) {  //Descriptor
			if (!Array.isArray(new_array)) {
				if (new_array === undefined || new_array === null)
				{
				
				}
				
				throw new Error(`@hasMany: Value ${json(new_array)} is not an array.`)
			}
			
			if (!new_array.every(m => (m instanceof Model) && m.Class[REACTIVE])) {
				throw new Error(`@hasMany: Value ${json(new_array)} contains non-@entity values.`)
			}
			else if (new_array.length) {
				this.Class.hasManys[key] = {Class: new_array[0].Class}
			}
			
			const old_array: Model[] = [...(this[key] || [])];
			
			INSTANCES.set(new_array, this)

			updateFieldMap(new_array)
			syncParents(old_array, new_array)
		}
	})
}


export function setHasManys<T extends Model>(this: void, Class: Class): void {
	for (const key in Class.hasManys || {}) {
		setHasMany(Class, key)
	}
}
