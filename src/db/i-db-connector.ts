import {IDbConfig} from "./i-db-config";
import {Model} from "../model/model";


export interface IDbConnector {

	init({hostname, url, master_url, username, pwd, db_name, authenticated}: IDbConfig): Promise<any>;

	upsert(query: object, data: object, collection_name: string): Promise<any>;

	delete<T>(query: object, collection_name: string): Promise<any>;

	close(): Promise<void>;

	list(collection_name: string, ids?: string[]): Promise<Model<any>[]>;

	delete_db(): Promise<any>;

	// get(collection_name: string, _ids: string[]): Promise<Model<any>>
}
