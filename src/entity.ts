//region imports
import "reflect-metadata";
import {IEntityInitOptions} from "./types/interfaces/i-entity-init-options";
import {Mongo} from "./db/mongo";
import {IdbConnector} from "./types/interfaces/idb-connector";
import {Class} from "./types/types/class";
import {Model} from "./abstract/Model";

//endregion

export function Entity<T extends { new(...args: any[]) }>({collection_name}: IEntityDecoratorOptions = {}) {
    return (Class) => {
        Class.collection_name = collection_name || (Class.name);
        Entity.Classes.push(Class);

        return new Proxy(Class, {
            construct(target: any, argArray: any, newTarget?: any): Model<T> {
                let inst:Model<T> = Reflect.construct(Class, argArray);
                inst.save();
                inst.is_loading = false;
                return inst
            }
        })

    }
}

export namespace Entity {
    export let db: IdbConnector;

    export const
        Classes: Class[] = [],
        init: (db: IEntityInitOptions) => Promise<any> = async ({db_config}: IEntityInitOptions): Promise<any> => {
            const db_instance = db_config.mongo_instance || new Mongo();
            Entity.db = db_instance;
            await db_instance.init(db_config)
            await Entity.loadAll()
        },
        loadAll: () => Promise<void> = async () => {
            Entity.Classes.forEach(async Class => {
                await Class.loadAll()
            })
        },

        clear_db: () => Promise<void> = async () => {
            await Entity.db.delete_db()
        };

}




