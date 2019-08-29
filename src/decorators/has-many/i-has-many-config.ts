//region imports
import {Class} from '../../model/types/class';
import {Model} from "../../model/model";

//endregion

export interface IHasManyConfig<T extends Model<T> = any> {
	[collection_name: string]: Class;
}
