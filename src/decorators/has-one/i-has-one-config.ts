//region imports
import {Class} from '../../model/types/class';
import {Model} from "../..";
//endregion

export interface IHasOneConfig<T extends Model<T> = any> {
	[collection_name: string]: Class;
}
