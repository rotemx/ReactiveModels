import {IdbConnector} from "../../types/interfaces/idb-connector";
import {IDBOptions} from "../../types/interfaces/idb-options";
import {serializeData} from "../../utils/serialize-data";
import {json, jsonify} from "../../utils/jsonify";

export class Mongo implements IdbConnector {
    close: () => Promise<void> = jest.fn()
    delete: (query, collection_name: string) => Promise<any> = jest.fn();
    init: ({hostname, url, master_url, username, pwd, db_name, authenticated}: IDBOptions) => Promise<any> = jest.fn()
    list: (collection: string) => Promise<any> = jest.fn()
    upsert: (query, data, collection_name: string) => Promise<any> = jest.fn(async (query, data, collection_name)=>{
        console.log(`upsert> query ${json(query)}. data: ${json(serializeData(data))}.`);
    });
}
