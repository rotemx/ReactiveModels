//region imports
import {Class} from '../../model/types/class';
import {Model} from "../../model/model";

//endregion

export interface IHasManyConfig {
	[key: string]: {
		Class:Class
	};
}
