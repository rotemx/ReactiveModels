//region imports
import "reflect-metadata";
import {IReactiveInitOptions} from "../../types/interfaces/i-reactive-init-options";
import {Mongo} from "../../db/mongo";
import {IdbConnector} from "../../types/interfaces/idb-connector";
import {Class} from "../../types/types/class";
import {Model} from "../../model/Model";
import {IReactiveDecoratorOptions} from "../../types/interfaces/i-reactive-decorator-options";

//endregion

export function Reactive<T extends Model<T>>({collection_name}: IReactiveDecoratorOptions = {}) {
	return (Class: Class) => {
		if (!Reactive.__init__) {
			throw new Error(`Please run Reactive.init() before using this decorator.`)
		}
		Class.collection_name = collection_name || (Class.name);
		Reactive.Classes.push(Class);
		Class.__reactive__ = true;
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

export namespace Reactive {
	export let db: IdbConnector;
	export let __init__: boolean = false;
	export const
		Classes: Class[]                                 = [],
		init: (db: IReactiveInitOptions) => Promise<any> = async ({db_config}: IReactiveInitOptions): Promise<any> => {
			Reactive.__init__ = true
			console.log('[>] Reactive Models Init Start');
			const db_instance = db_config.mongo_instance || new Mongo();
			Reactive.db = db_instance;
			await db_instance.init(db_config)
			await Reactive.loadAll()
			console.log('[] Reactive Models Init End');

		},
		loadAll: () => Promise<void>                     = async () => {
			Reactive.Classes.forEach(async Class => {
				await Class.loadAll()
			})
		},

		clear_db: () => Promise<void>                    = async () => {
			await Reactive.db.delete_db()
		};

}




