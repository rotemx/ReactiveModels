import {IParentModelConfig} from "./i-parent-model-config";
import {HasManyInstancesDic, HasOneInstancesDic} from "../helpers/model-helpers";

export interface IModelInternals {
	hasManys?: HasManyInstancesDic;
	hasOnes?: HasOneInstancesDic;
	parents?: IParentModelConfig[]
	values?: { [key: string]: any }
}
