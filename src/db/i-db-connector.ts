import {IDbConfig}       from "./i-db-config";
import {Model}           from "../model/model";
import {Db, MongoClient} from "mongodb";


export interface IDbConnector {

	client:MongoClient;
	db:Db;
	
	init({hostname, url, master_url, username, pwd, db_name, authenticated}: IDbConfig): Promise<any>;

	upsert(query: object, data: object, collection_name: string): Promise<any>;

	delete<T>(query: object, collection_name: string): Promise<any>;

	close(): Promise<void>;

	list(collection_name: string, ids?: string[]): Promise<Model[]>;

	delete_db(): Promise<any>;

	list_collections(): Promise<string[]>
	// get(collection_name: string, _ids: string[]): Promise<Model<any>>
}
