import {Model} from "../..";

export type ArrayMethod = (keyof Array<any>);
export const
	isIndex                                    = (prop) => !(prop instanceof Symbol) && !isNaN(+prop),

	MUTATING_ARRAY_FUNCTIONS:ArrayMethod[]     = ['push', 'pop', 'shift', 'unshift', 'splice', 'copyWithin', 'fill'],
	NON_DELETING_ARRAY_FUNCTIONS:ArrayMethod[] = ['push', 'unshift', 'reverse', 'sort'];


export type AnyFunction = (...args: any[]) => any;

export const INSTANCES: WeakMap<any, Model> = new Map()
