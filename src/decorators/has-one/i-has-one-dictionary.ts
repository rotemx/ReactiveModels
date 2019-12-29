//region imports
import {Class} from '../../model/types/class';
//endregion

export interface IHasOneDictionary{
	[collection_name: string]: Class;
}
