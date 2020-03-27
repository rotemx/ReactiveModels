//region imports
import "reflect-metadata";
import {IEntityInitOptions}             from "./i-entity-init-options";
import {Mongo}                          from "../../db/mongo";
import {IDbConnector}                   from "../../db/i-db-connector";
import {Class}                          from "../../model/types/class";
import {Model}                          from "../..";
import {IEntityDecoratorOptions}        from "./i-entity-decorator-options";
import {setHasManys}                    from "../has-many/set-has-manys";
import {setHasOnes}                     from "../has-one/set-has-ones";
import {setFields}                      from "../field/set-fields";
import {IS_LOADING, REACTIVE}           from "../../model/helpers/model-helpers";
import {json}                           from "../../utils/jsonify";
import {IClassConfig, IClassConfigDict} from "./i-class-config-dict";

const DEFAULT_REACTIVE_INIT_OPTIONS: IEntityInitOptions = {
	      db_config: {
		      hostname     : 'localhost',
		      port         : 27017,
		      authenticated: false
	      }
      },
      CONFIG_COLLECTION_NAME                            = '__EntityConfig__';

//endregion

export function Entity<T extends Model<T>>({collection_name}: IEntityDecoratorOptions = {}) {
	return (Class: Class) => {
		if (!Entity.__init__) {
			throw new Error(`Please run "await Entity.init()" before using the @Entity() decorator.`)
		}
		Class[REACTIVE] = true;
		Class.collection_name = collection_name || (Class.name);
		Class.instances = [];
		Class.fields_config = Class.fields_config || []
		Class.hasOnes = Class.hasOnes || {}
		Class.hasManys = Class.hasManys || {}
		
		let saved_config = Entity.class_config[Class.collection_name] && Entity.class_config[Class.collection_name].hasManys
		
		if (saved_config) {
			for (let key of Object.keys(saved_config)) {
				if (Class.hasManys[key]) {
					Class.hasManys[key].collection_name = saved_config[key].collection_name
				}
			}
		}
		
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
		__init__: boolean                                    = false,
		instances_data: { [collection_name: string]: any[] } = {},
		Classes: Class[]                                     = [],
		promises: Promise<any>[]                             = [],
		class_config: IClassConfigDict                       = {};
	
	export const
		init: (db?: IEntityInitOptions) => Promise<any>              = async ({db_config}: IEntityInitOptions = DEFAULT_REACTIVE_INIT_OPTIONS): Promise<any> => {
			Entity.__init__ = true
			console.log('[>] Entity Models Initializing...');
			if (!Entity.db_connector) {
				const db_instance = db_config.mongo_instance || new Mongo();
				Entity.db_connector = db_instance;
				await db_instance.init(db_config);
			}
			await loadConfig()
			await loadInstancesData();
			console.log('[] Entity Models Initialized.');
		},
		loadConfig: () => Promise<void>                              = async () => {
			let config = (await Entity.db_connector.list<IClassConfig>(CONFIG_COLLECTION_NAME));
			if (config.length) {
				console.log(`>>>config loaded: ${json(config)}`);
				Entity.class_config = config.reduce<IClassConfigDict>((pre, curr) => {
					pre[curr.collection_name] = {
						collection_name: curr.collection_name,
						hasManys       : curr.hasManys
					}
					return pre
				}, {});
				
				for (const class_config of config) {
					let Class = Entity.Classes.find(cl => cl.collection_name === class_config.collection_name)
					if (Class) {
						Class.hasManys = class_config.hasManys
					}
				}
			}
		},
		reset: () => Promise<any>                                    = async () => {
			Entity.__init__ = false;
			console.log('[>] Entity Models Resetting...');
			// await Entity.db_connector.close();
			// Entity.db_connector = null;
			Entity.instances_data = {}
			Entity.Classes.forEach(Class => {
				Class.collection_name = undefined;
				Class[REACTIVE] = false;
				Class.instances = [];
				Class.fields_config = []
				Class.hasOnes = {}
				Class.hasManys = {}
			})
			Entity.Classes = []
		},
		loadInstancesData: () => Promise<void>                       = async () => {
			let
				collections = await Entity.db_connector
				                          .list_collections(),
				proms       = collections.map(coll_name => Entity.db_connector.list(coll_name))
			
			return Promise.all<any[]>(proms)
			              .then(arrays =>
				              arrays
					              .forEach((models_data, i) => Entity.instances_data[collections[i]] = models_data))
		},
		clearDb: () => Promise<void>                                 = () => {
			
			if (!Entity.__init__) {
				throw new Error(`Please initialize ReavtiveModels with 'await Entity.init()' before calling clearDb()`)
			}
			return Entity.db_connector.delete_db()
		},
		find: (_id: string, collection_name: string) => Model | null = (_id, collection_name) => {
			const Class = Entity.Classes.find(c => c.collection_name === collection_name);
			return Class ? Class.get(_id) : null
		},
		saveConfig: (Class?: Class) => Promise<void>                 = async (Class?: Class) => {
			
			if (Class) {
				return Entity.db_connector.upsert(
					{
						_id: Class.collection_name
					},
					{
						collection_name: Class.collection_name,
						hasManys       : Class.hasManys
					},
					CONFIG_COLLECTION_NAME)
			}
			
			const config = Entity.Classes.map(Class =>
				({
					_id            : Class.collection_name,
					collection_name: Class.collection_name,
					hasMany        : Class.hasManys
				}))
			return Entity.db_connector.bulkWrite(CONFIG_COLLECTION_NAME, config)
		}
}




