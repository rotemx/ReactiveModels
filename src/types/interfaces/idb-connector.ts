import {IDBConfig} from "./idb-config";


export interface IdbConnector {

    init({hostname, url, master_url, username, pwd, db_name, authenticated}: IDBConfig): Promise<any>;

    upsert(query, data, collection_name: string): Promise<any>;

    delete(query, collection_name: string): Promise<any>;

    close(): Promise<void>;

    list(collection_name: string): Promise<any>;

    delete_db(): Promise<any>;
}
