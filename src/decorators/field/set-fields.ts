//region imports
import {isPrimitive} from "../../utils/is-primitive";
import {IFieldConfig} from "./i-field-config";
import {Class} from "../../model/types/class";
import {FIELDS, THIS} from "../../model/helpers/model-helpers";
import {IFieldInstance, IFieldMap} from "../../model/types/i-field-map";
import {Model} from "../..";
import {ArrayMethod, MUTATING_ARRAY_FUNCTIONS} from "../has-many/helpers";
import {cloneDeep, isEqual} from 'lodash'

const READ_ONLYS = ['prototype']

//endregion

function setField(Class: Class, {key}: IFieldConfig) {

	const proxyFactory = (target, key): ProxyConstructor => {
		let proxy: ProxyConstructor;

		return new Proxy(target, {
			get           : (target, property) => {
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
							target[THIS].update(key)
						}
					}
				}

				if (!proxy) {
					target[property][THIS] = target[THIS]
					proxy = proxyFactory(target[property], key)
				}
				return proxy
			},
			set           : (target, property, value, receiver) => {
				const old_value = target[property];
				if (!isEqual(value, old_value)) {
					target[property] = value;
					target[THIS].update(key)
				}
				return true;
			},
			deleteProperty: (target, index: number) => {
				delete target[index]
				target[THIS].update(key)
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
					value[THIS] = this;
					field.proxy = proxyFactory(value, key);
				}
				return field.proxy
			},
			set       : function (this: Model, new_value) { //Descriptor
				const fields: IFieldMap = this[FIELDS];

				if (isPrimitive(new_value)) {
					fields[key] = {
						value: new_value,
						proxy: null,
						mode : "primitive"
					}
				}
				else {
					new_value[THIS] = this;
					fields[key] = {
						value: null,
						proxy: proxyFactory(new_value, key),
						mode : "proxy"
					}
				}
				this.update(key)
			}
		}
	)
}

export function setFields(Class: Class): void {
	for (const field of Class.fields) {
		setField(Class, field)
	}
}
