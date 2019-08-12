//region imports
import {Class} from '../types/class';
import {Model} from "../../abstract/model";
//endregion

export interface IHasOne<T extends Model<T> = any> {
    key: string;
    Class: Class;
}
