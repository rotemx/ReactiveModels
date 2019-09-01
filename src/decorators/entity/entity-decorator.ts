//region imports
import "reflect-metadata";
import {IEntityInitOptions} from "./i-entity-init-options";
import {Mongo} from "../../db/mongo";
import {IDbConnector} from "../../db/i-db-connector";
import {Class} from "../../model/types/class";
import {Model} from "../..";
import {IEntityDecoratorOptions} from "./i-entity-decorator-options";
import {setHasManys} from "../has-many/set-has-manys";

const DEFAULT_REACTIVE_INIT_OPTIONS: IEntityInitOptions = {
	db_config: {
		hostname     : 'localhost',
		port         : 27017,
		authenticated: false

	}
}

//endregion

export function Entity<T extends Model<T>>({collection_name}: IEntityDecoratorOptions = {}) {
	return (Class: Class) => {
		if (!Entity.__init__) {
			throw new Error(`Please run Reactive.init() before using this decorator.`)
		}

		Class.collection_name = collection_name || (Class.name);
		Entity.Classes.push(Class);
		Class.__reactive__ = true;

		/*
		 Object.defineProperty(Class.prototype, 'values', {
		 enumerable: false,
		 writable  : true,
		 value     : new Map()
		 })
		 */


		setHasManys(Class)

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
	export let db: IDbConnector;
	export let __init__: boolean = false;
	export const
		Classes: Class[]                                = [],
		init: (db?: IEntityInitOptions) => Promise<any> = async ({db_config}: IEntityInitOptions = DEFAULT_REACTIVE_INIT_OPTIONS): Promise<any> => {
			Entity.__init__ = true
			console.log('[>] Entity Models Initializing...');
			const db_instance = db_config.mongo_instance || new Mongo();
			Entity.db = db_instance;
			await db_instance.init(db_config)
			await Entity.loadAll()
			console.log('[] Entity Models Initialized.');

		},
		loadAll: () => Promise<void>                    = async () => {
			for (const Class of Entity.Classes) {
				await Class.loadAll()

			}
		},
		clear_db: () => Promise<void>                   = () => Entity.db.delete_db()
}




