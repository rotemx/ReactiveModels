import {IHasManyDictionary} from "../has-many/i-has-many-dictionary";

export interface IClassConfig {
	hasManys: IHasManyDictionary;
	collection_name: string;
}

export interface IClassConfigDict {
	[collection_name: string]: IClassConfig
}
