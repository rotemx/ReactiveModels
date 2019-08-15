//region imports
import {IdbConnector} from "../../types/interfaces/idb-connector";
import {serializeData} from "../serialize-data";
import {json} from "../../utils/jsonify";
import {IDBConfig} from "../../types/interfaces/idb-config";
//endregion

const promiseFn = () => Promise.resolve();

export class Mongo implements IdbConnector {
	close: () => Promise<void> = jest.fn()
	delete: (query, collection_name: string) => Promise<any> = jest.fn(promiseFn);
	init: ({hostname, url, master_url, username, pwd, db_name, authenticated}: IDBConfig) => Promise<any> = jest.fn(promiseFn)
	list: (collection: string) => Promise<any> = jest.fn(async ()=>[])
	upsert: (query, data, collection_name: string) => Promise<any> = jest.fn(async (query, data, collection_name) => {
		console.log(`upsert> query ${json(query)}. data: ${json(serializeData(data))}.`);
		return promiseFn
	});
	delete_db: () => Promise<any> = jest.fn(promiseFn)
}
