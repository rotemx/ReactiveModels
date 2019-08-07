import {IdbConnector} from "./idb-connector";
import {IEntityInitOptions} from "./entity-init-options";


export interface IEntity {
    (options:IEntityInitOptions):void
    init:()=>Promise<any>
    db:IdbConnector
}
