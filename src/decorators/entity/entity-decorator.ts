//region imports
import "reflect-metadata";
import {IEntityInitOptions}      from "./i-entity-init-options";
import {Mongo}                   from "../../db/mongo";
import {IDbConnector}            from "../../db/i-db-connector";
import {Class}                   from "../../model/types/class";
import {Model}                   from "../..";
import {IEntityDecoratorOptions} from "./i-entity-decorator-options";
import {setHasManys}             from "../has-many/set-has-manys";
import {setHasOnes}              from "../has-one/set-has-ones";
import {setFields}               from "../field/set-fields";
import {IS_LOADING, REACTIVE}    from "../../model/helpers/model-helpers";

const DEFAULT_REACTIVE_INIT_OPTIONS: IEntityInitOptions = {
	db_config: {
		hostname     : 'localhost',
		port         : 27017,
		authenticated: false
		
	}
}

//endregion

export function  Entity<T extends Model<T>>({collection_name}: IEntityDecoratorOptions = {}) {
	return (Class: Class) => {
		if (!Entity.__init__) {
			throw new Error(`Please run "await Entity.init()" before using the @Entity() decorator.`)
		}
		Class[REACTIVE] = true;
		Class.collection_name = collection_name || (Class.name);
		Class.instances = [];
		Class.fields = Class.fields || []
		Class.hasOnes = Class.hasOnes || {}
		Class.hasManys = Class.hasManys || {}
		
		setHasManys(Class)
		setHasOnes(Class)
		setFields(Class)
		
		Class.load_from_data()
		const Class_proxy = new Proxy(Class, {
			construct(target: any, argArray: any, newTarget?: any): Model {
				let This: Model = Reflect.construct(Class, argArray);
				This.save();
				This[IS_LOADING] = false;
				This.Class.instances.push(This)
				return This
			}
		})
		Entity.Classes.push(Class_proxy)
		return Class_proxy
	}
}

export namespace Entity {
	export let
		db_connector: IDbConnector,
		__init__: boolean = false;
	
	export let
		instances_data: { [collection_name: string]: any[] } = {},
		Classes: Class[]                                     = [];
	
	export const
		promises: Promise<any>[] = [];
	
	export const
		init: (db?: IEntityInitOptions) => Promise<any>       = async ({db_config}: IEntityInitOptions = DEFAULT_REACTIVE_INIT_OPTIONS): Promise<any> => {
			Entity.__init__ = true
			console.log('[>] Entity Models Initializing...');
			if (!Entity.db_connector) {
				const db_instance = db_config.mongo_instance || new Mongo();
				Entity.db_connector = db_instance;
				await db_instance.init(db_config);
			}
			await load_instances_data();
			console.log('[] Entity Models Initialized.');
		},
		reset: () => Promise<any>                             = async () => {
			Entity.__init__ = false;
			console.log('[>] Entity Models Resetting...');
			// await Entity.db_connector.close();
			// Entity.db_connector = null;
			Entity.instances_data = {}
			Entity.Classes.forEach(Class => {
				Class.collection_name = undefined;
				Class[REACTIVE] = false;
				Class.instances = [];
				Class.fields = []
				Class.hasOnes = {}
				Class.hasManys = {}
			})
			Entity.Classes = []
		},
		load_instances_data: () => Promise<void>              = async () => {
			let
				collections = await Entity.db_connector
					.list_collections(),
				proms       = collections.map(coll_name => Entity.db_connector.list(coll_name))
			
			return Promise.all<any[]>(proms)
				.then(arrays => {
					arrays.forEach((models_data, i) => {
						Entity.instances_data[collections[i]] = models_data
					})
				})
		},
		clear_db: () => Promise<void>                         = () => Entity.db_connector.delete_db(),
		find: (_id: string, collection_name: string) => Model | null = (_id, collection_name) => {
			const Class = Entity.Classes.find(c => c.collection_name === collection_name);
			return Class ? Class.get(_id) : null
		}
}




