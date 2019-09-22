//region imports
import {isPrimitive}                                      from "../../utils/is-primitive";
import {IFieldConfig}                                     from "./i-field-config";
import {Class}                                            from "../../model/types/class";
import {FIELDS}                                           from "../../model/helpers/model-helpers";
import {IFieldInstance, IFieldMap}                        from "../../model/types/i-field-map";
import {Model}                                            from "../..";
import {ArrayMethod, INSTANCES, MUTATING_ARRAY_FUNCTIONS} from "../has-many/helpers";
import {cloneDeep, isEqual}                               from 'lodash'

const READ_ONLYS = ['prototype']
//endregion


function setField(Class: Class, {key}: IFieldConfig) {
	
	const proxyFactory = (target, key): ProxyConstructor => {
		let proxy_map = new Map<string, ProxyConstructor>()
		
		
		return new Proxy(target, {
			get           : (target, property) => {     //Proxy
				const value = target[property];
				if (isPrimitive(value) || READ_ONLYS.includes(<string>property)) {
					return value;
				}
				
				if (Array.isArray(target) &&
					typeof value === "function" &&
					MUTATING_ARRAY_FUNCTIONS.includes(<ArrayMethod>property)
				) {
					console.log(`> Called array-mutating function ${<string>property}`);
					return (...args: any[]) => {
						const old_value = cloneDeep(target);
						value.apply(target, args);
						if (!isEqual(old_value, target)) {
							INSTANCES.get(target) && INSTANCES.get(target).update(key) //todo:remove &&
						}
					}
				}
				
				if (!proxy_map[property]) {
					INSTANCES.set(target[property], INSTANCES.get(target))
					proxy_map.set(<string>property, proxyFactory(target[property], key))
				}
				return proxy_map.get(<string>property)
			},
			set           : (target, property, value, receiver) => {  //Proxy
				const old_value = target[property];
				if (!isEqual(value, old_value)) {
					target[property] = value;
					const This = INSTANCES.get(target);
					if (!isPrimitive(value)) {
						INSTANCES.set(target[property], This);
					}
					This.update(key)
				}
				return true;
			},
			deleteProperty: (target, index: number) => {
				delete target[index]
				if (typeof index !== "symbol") {
					INSTANCES.get(target).update(key)
				}
				return true
			},
		})
	}
	
	Object.defineProperty(Class.prototype, key,
		{
			enumerable: true,
			get       : function (this: Model) {  //Descriptor
				const
					field: IFieldInstance = this[FIELDS][key],
					value                 = field && field.value;
				if (!field || !field.mode) return;
				if (field.mode === 'primitive') {
					return value
				}
				if (!field.proxy) {
					// value[THIS] = this;
					INSTANCES.set(value, this)
					field.proxy = proxyFactory(value, key);
				}
				return field.proxy
			},
			set       : function (this: Model, value) { //Descriptor
				const fields: IFieldMap = this[FIELDS];
				
				if (isPrimitive(value)) {
					fields[key] = {
						value,
						proxy: null,
						mode : "primitive"
					}
				}
				else {
					INSTANCES.set(value, this)
					fields[key] = {
						value: null,
						proxy: proxyFactory(value, key),
						mode : "proxy"
					}
				}
				if (value === undefined){
					return this.unset(key)
				}
				return this.update(key)
			}
		}
	)
}

export function setFields(Class: Class): void {
	for (const field of Class.fields) {
		setField(Class, field)
	}
}
