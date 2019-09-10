import {Model} from "../model";

export type Primitive = undefined | null | string | boolean | number | string[];

export interface IFieldInstance {
	value: Primitive;
	proxy: ProxyConstructor | Model[];
	hasOne?: boolean;
	hasMany?: boolean;
	mode : 'primitive' | 'proxy' | 'entity' | null;
}

export interface IFieldMap {
	[key: string]: IFieldInstance
}
