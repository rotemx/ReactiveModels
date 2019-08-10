import {Model} from "../../abstract/model";

export interface IField<T extends Model<T> = any> {
    key: string;
    type: any;
}
