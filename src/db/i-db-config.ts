import {IDbConnector} from "./i-db-connector";
import {MongoClient}  from "mongodb";

export interface IDbConfig {
	hostname?: string
	url?: string
	master_url?: string
	username?: string
	pwd?: string
	authenticated?: boolean
	db_name?: string
	port?: number
	mongo_instance?: IDbConnector,
	mongo_client? : MongoClient
}
