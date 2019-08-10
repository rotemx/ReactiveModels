import {UserClass} from "../../entity";
import {Model} from "../../abstract/model";

export interface IHasOne<T extends Model<T> = any> {
    key: string;
    UserClass: UserClass;
}
