//region imports
import {IDbConfig}       from "./i-db-config";
import {Model}           from "../model/model";
import {Db, MongoClient} from "mongodb";
import {IDableObject}    from "./i-idable";

//endregion

export interface IDbConnector {
	
	client: MongoClient;
	db: Db;
	
	init({hostname, url, master_url, username, pwd, db_name, authenticated}: IDbConfig): Promise<any>;
	
	upsert(query: object, data: object, collection_name: string): Promise<any>;
	
	delete<T>(query: object, collection_name: string): Promise<any>;
	
	close(): Promise<void>;
	
	list<T = Model>(collection_name: string, ids?: string[]): Promise<T[]>;
	
	delete_db(): Promise<any>;
	
	list_collections(): Promise<string[]>
	
	// get(collection_name: string, _ids: string[]): Promise<Model<any>>
	
	unset(_id: string, collection_name, key)
	
	bulkWrite<T extends Model<T>>(collection_name: string, data: IDableObject[]): Promise<any>;
	
}
