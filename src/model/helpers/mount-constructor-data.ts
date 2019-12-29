//region imports
import {FIELDS, PARENTS} from "./model-helpers";
import {IFieldInstance}  from "../types/i-field-map";
import {isPrimitive}     from "../../utils/is-primitive";
import {Model}           from "../model";

//endregion

function mountField(this: Model, data: any, key: string) {
	let value = data[key];
	this[FIELDS][key] = <IFieldInstance>{
		value,
		hasMany: false,
		hasOne : false,
		proxy  : null,
		mode   : isPrimitive(value) ? "primitive" : "proxy"
	}
}

function mountHasOne(this: Model, data: any, key: string) {
	let value = data[key];
	if (value instanceof Model) {
		this[key] = value
		return
	}
	
	this[FIELDS][key] = <IFieldInstance>{
		value,
		hasMany: false,
		hasOne : true,
		proxy  : null,
		mode   : isPrimitive(value) ? "primitive" : "proxy"
	}
}

function mountHasMany(this: Model, data: any, key: string) {
	let value = data[key];
	if (!value) {
		value = []
	}
	if (!Array.isArray(value)) {
		throw new Error(`@hasMany field ${key} in class ${this.Class.name} is not an array`)
	}
	if (!value.every(m => (m instanceof Model)) && !value.every(m => (typeof m === "string"))) {
		throw new Error(`@hasMany field ${key} in class ${this.Class.name} is not all id strings or all Models`)
	}
	
	if (value.every(m => m instanceof Model)) {
		this[key] = value
		return;
	}
	this[FIELDS][key] = <IFieldInstance>{
		value,
		hasMany: true,
		hasOne : false,
		proxy  : null,
		mode   : isPrimitive(value) ? "primitive" : "proxy"
	}
}

export function mountConstructorData(this: Model, data) {
	if (data) {
		if (data._id) {
			this._id = data._id
		}
		if (data['__parents__']) {
			this[PARENTS] = data['__parents__']
			delete data['__parents__'];
		}
		
		this.Class.fields_config
			.map(f => f.key)
			.forEach(key => mountField.call(this, data, key));
		
		Object.keys(this.Class.hasManys)
			.forEach(key => mountHasMany.call(this, data, key));
	
		Object.keys(this.Class.hasOnes)
			.forEach(key => mountHasOne.call(this, data, key));
	}
}
