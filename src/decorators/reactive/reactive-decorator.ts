//region imports
import "reflect-metadata";
import {IReactiveInitOptions} from "./i-reactive-init-options";
import {Mongo} from "../../db/mongo";
import {IDbConnector} from "../../db/i-db-connector";
import {Class} from "../../model/types/class";
import {Model} from "../..";
import {IReactiveDecoratorOptions} from "./i-reactive-decorator-options";

const DEFAULT_REACTIVE_INIT_OPTIONS: IReactiveInitOptions = {
	db_config: {
		hostname     : 'localhost',
		port         : 27017,
		authenticated: false

	}
}

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
	export let db: IDbConnector;
	export let __init__: boolean = false;
	export const
		Classes: Class[]                                  = [],
		init: (db?: IReactiveInitOptions) => Promise<any> = async ({db_config}: IReactiveInitOptions = DEFAULT_REACTIVE_INIT_OPTIONS): Promise<any> => {
			Reactive.__init__ = true
			console.log('[>] Reactive Models Initializing...');
			const db_instance = db_config.mongo_instance || new Mongo();
			Reactive.db = db_instance;
			await db_instance.init(db_config)
			await Reactive.loadAll()
			console.log('[] Reactive Models Initialized.');

		},
		loadAll: () => Promise<void>                      = async () => {
			Reactive.Classes.forEach(async Class => {
				await Class.loadAll()
			})
		},

		clear_db: () => Promise<void>                     = async () => {
			await Reactive.db.delete_db()
		};

}




