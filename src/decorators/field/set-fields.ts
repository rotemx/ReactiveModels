//region imports

import {isPrimitive} from "../../utils/is-primitive";
import {Model} from "../..";
import {updateFn} from "../../utils/proxy-handler-factory";
import {IFieldConfig} from "./i-field-config";

const READ_ONLYS = ['prototype']

//endregion

export function setField(root: any, {key}: IFieldConfig, update: updateFn = root.update, value?) {

	function proxyFactory(target, key): ProxyConstructor {
		let proxy: ProxyConstructor;

		return new Proxy(target, {
			get: (target, property) => {
				const value = target[property];
				if (isPrimitive(value) ||
					READ_ONLYS.includes(<string>property) ||
					typeof value === "function"
				) {
					return value;
				} else {
					if (!proxy) {
						proxy = proxyFactory(target[property], key)
					}
					return proxy
				}
			},
			set: (target, property, value, receiver) => {
				target[property] = value;
				if (!(Array.isArray(target) && property === 'length')) {
					update && update({[key]: root[key]})
				}
				return true;
			}
		})
	}

	function setDescriptor(root, key: string, _value) {
		let
			init: boolean =  _value !== undefined,
			value: any = _value,
			proxy: ProxyConstructor;

		Object.defineProperty(root, key,
			{
				enumerable: true,
				get       : () => {
					if (!init) return;
					if (isPrimitive(value)) {
						proxy = undefined;
						return value
					}
					if (!proxy) {
						proxy = proxyFactory(value, key)
					}
					return proxy

				},
				set       : (new_value) => {
					init = true;
					value = new_value;
					update && update({[key]: new_value})
				}
			}
		)
	}
	setDescriptor(root, key, value)
}


export function setFields(this: Model<any>): void {
	this.Class.fields.forEach(field =>
		setField(this, field)
	)
}
