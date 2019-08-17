//region imports
import {Class} from '../types/class';
import {Model} from "../../abstract/Model";

//endregion

export interface IHasManyConfig<T extends Model<T> = any> {
	[collection_name: string]:Class;
}
