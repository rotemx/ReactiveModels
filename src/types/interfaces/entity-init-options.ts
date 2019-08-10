import {IDBConfig} from "./idb-config";


export interface IEntityInitOptions {
    db_config: IDBConfig
    load_all? :boolean
}
