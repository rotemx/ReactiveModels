import {IDBOptions} from "./idb-options";


export interface IdbConnector {

    init({hostname, url, master_url, username, pwd, db_name, authenticated}: IDBOptions): Promise<any>;

    upsert(query, data, collection_name: string): Promise<any>;

    delete(query, collection_name: string): Promise<any>;

    close(): Promise<void>;

    list(collection: string): Promise<any>;
}
