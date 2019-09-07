//region imports
import "reflect-metadata";
import {IEntityInitOptions} from "./i-entity-init-options";
import {Mongo} from "../../db/mongo";
import {IDbConnector} from "../../db/i-db-connector";
import {Class} from "../../model/types/class";
import {Model} from "../..";
import {IEntityDecoratorOptions} from "./i-entity-decorator-options";
import {setHasManys} from "../has-many/set-has-manys";
import {setHasOnes} from "../has-one/set-has-ones";
import {setFields} from "../field/set-fields";

const DEFAULT_REACTIVE_INIT_OPTIONS: IEntityInitOptions = {
	db_config: {
		hostname     : 'localhost',
		port         : 27017,
		authenticated: false

	}
}

//endregion

export function Entity<T extends Model>({collection_name}: IEntityDecoratorOptions = {}) {
	return (Class: Class) => {
		if (!Entity.__init__) {
			throw new Error(`Please run "await Entity.init()" before using this decorator.`)
		}

		Entity.Classes.push(Class);

		Class.collection_name = collection_name || (Class.name);
		Class.__reactive__ = true;
		Class.instances = [];
		Class.fields = Class.fields || []
		Class.hasOnes = Class.hasOnes || {}
		Class.hasManys = Class.hasManys || {}

		setHasManys(Class)
		setHasOnes(Class)
		setFields(Class)

		Class.loadAll()
		return new Proxy(Class, {
			construct(target: any, argArray: any, newTarget?: any): Model {
				const inst: Model = Reflect.construct(Class, argArray);
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
		Classes: Class[]                                      = [],
		init: (db?: IEntityInitOptions) => Promise<any>       = async ({db_config}: IEntityInitOptions = DEFAULT_REACTIVE_INIT_OPTIONS): Promise<any> => {
			Entity.__init__ = true
			console.log('[>] Entity Models Initializing...');
			const db_instance = db_config.mongo_instance || new Mongo();
			Entity.db = db_instance;
			await db_instance.init(db_config)
			console.log('[] Entity Models Initialized.');

		},
		loadAll: () => Promise<void>                          = async () => {
			for (const Class of Entity.Classes) {
				await Class.loadAll()
			}
		},
		clear_db: () => Promise<void>                         = () => Entity.db.delete_db(),
		find: (_id: string, collection_name: string) => Model = (_id, collection_name) => {
			const Class = Entity.Classes.find(c => c.collection_name === collection_name);
			return Class.get(_id);
		}
}




