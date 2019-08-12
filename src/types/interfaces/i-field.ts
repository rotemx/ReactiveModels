//region imports
import {Model} from "../../abstract/model";
//endregion

export interface IField<T extends Model<T> = any> {
    key: string;
    type: any;
}
