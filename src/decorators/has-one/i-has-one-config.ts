//region imports
import {Class} from '../../model/types/class';
//endregion

export interface IHasOneConfig{
	[collection_name: string]: Class;
}
