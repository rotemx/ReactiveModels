//region imports
import {Class} from '../types/class';
import {Model} from "../../model/Model";

//endregion

export interface IHasOneConfig<T extends Model<T> = any> {
	[collection_name: string]: Class;
}
