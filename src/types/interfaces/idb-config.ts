import {IdbConnector} from "./idb-connector";

export interface IDBConfig {
	hostname?: string
	url?: string
	master_url?: string
	username?: string
	pwd?: string
	authenticated?: boolean
	db_name?: string
	port?: number
	mongo_instance?: IdbConnector
}
