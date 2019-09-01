import {Model} from "../model";

export type HasManyInstancesDic = { [key: string]: string[] };
export type HasOneInstancesDic = { [key: string]: string };
export type PartialModel = Partial<Model<any>>;


export const INT = Symbol('INT');
