//region imports
import {IDbConnector} from "../i-db-connector";
import {serializeData} from "../serialize-data";
import {json} from "../../utils/jsonify";
import {IDbConfig} from "../i-db-config";
//endregion

const promiseFn = () => Promise.resolve();

export class Mongo implements IDbConnector {
	close: () => Promise<void> = jest.fn()
	delete: (query, collection_name: string) => Promise<any> = jest.fn(promiseFn);
	init: ({hostname, url, master_url, username, pwd, db_name, authenticated}: IDbConfig) => Promise<any> = jest.fn(promiseFn)
	list: (collection: string) => Promise<any> = jest.fn(async () => [])
	upsert: (query, data, collection_name: string) => Promise<any> = jest.fn(async (query, data, collection_name) => {
		console.log(`MOCK upsert => \n query ${json(query)}\n data: ${json(serializeData(data))}.`);
		return promiseFn
	});
	delete_db: () => Promise<any> = jest.fn(promiseFn)
}
