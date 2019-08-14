//region imports
import {Model} from "./Model";
import {isPrimitive} from "../utils/serialize-data";
import {proxyHandlerFactory} from "../utils/proxy-handler-factory";

//endregion


export function setFields(this: Model<any>): void {
	for (const {key, type} of this.Class.fields) {
		(() => {
			let
				mode: 'primitive' | 'object' = 'primitive',
				primitive_value,
				proxy;

			const current_val = this[key];

			isPrimitive(current_val) ? primitive_value = current_val : proxy = new Proxy(current_val, proxyHandlerFactory(key, this.update))

			Object.defineProperty((this), key, {
				enumerable: true,
				get       : () => {
					return mode === "primitive" ? primitive_value : proxy
				},
				set       : async (value) => {

					if (isPrimitive(value)) {
						primitive_value = value;
						mode = "primitive"
					} else {
						mode = "object"
						proxy = new Proxy(value, proxyHandlerFactory(key, this.update));
					}

					if (this.Class.auto_update_DB) {
						await this.update({[key]: value})
					}
				}
			})
		})();
	}
}
