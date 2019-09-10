import {Model} from "../model";


export type PartialModel = Partial<Model>;

export const FIELDS = Symbol('FIELDS');
export const PARENTS = Symbol('PARENTS');
export const THIS = Symbol('THIS');
export const REACTIVE = Symbol('REACTIVE');
export const INIT = Symbol('INIT');
export const IS_LOADING = Symbol('IS_LOADING');
