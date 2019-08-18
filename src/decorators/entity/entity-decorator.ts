//region imports
import "reflect-metadata";
import {IEntityInitOptions} from "../../types/interfaces/i-entity-init-options";
import {Mongo} from "../../db/mongo";
import {IdbConnector} from "../../types/interfaces/idb-connector";
import {Class} from "../../types/types/class";
import {Model} from "../../model/Model";
import {IEntityDecoratorOptions} from "../../types/interfaces/i-entity-decorator-options";

//endregion

export function Entity<T extends Model<T>>({collection_name}: IEntityDecoratorOptions = {}) {
	return (Class:Class) => {
		Class.collection_name = collection_name || (Class.name);
		Entity.Classes.push(Class);
		Class.__entity__ = true;
		return new Proxy(Class, {
			construct(target: any, argArray: any, newTarget?: any): Model<T> {
				const inst: Model<T> = Reflect.construct(Class, argArray);
				inst.save();
				inst._is_loading = false;
				return inst
			}
		})

	}
}

export namespace Entity {
	export let db: IdbConnector;

	export const
		Classes: Class[]                               = [],
		init: (db: IEntityInitOptions) => Promise<any> = async ({db_config}: IEntityInitOptions): Promise<any> => {
		console.log('[>] Entity Framework Init Start');
		const db_instance = db_config.mongo_instance || new Mongo();
			Entity.db = db_instance;
			await db_instance.init(db_config)
			await Entity.loadAll()
			console.log('[] Entity Framework Init End');

		},
		loadAll: () => Promise<void>                   = async () => {
			Entity.Classes.forEach(async Class => {
				await Class.loadAll()
			})
		},

		clear_db: () => Promise<void>                  = async () => {
			await Entity.db.delete_db()
		};

}




