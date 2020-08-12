//region imports
import {IHasOneDictionary}                     from "../decorators/has-one/i-has-one-dictionary";
import {IFieldConfig}                          from "../decorators/field/i-field-config";
import {Class}                                 from "./types/class";
import {json}                                  from "../utils/jsonify";
import {IHasManyDictionary}                    from "../decorators/has-many/i-has-many-dictionary";
import {serializeData}                         from "../db/serialize-data";
import * as shortid                            from 'shortid';
import {Entity}                                from "..";
import {IFieldMap}                             from "./types/i-field-map";
import {FIELDS, IS_LOADING, PARENTS, REACTIVE} from "./helpers/model-symbols";
import {IParentConfig}                         from "./types/i-parent-config";
import {decycle}                               from "json-cyclic"
import {atomify}                               from "./helpers/atomify";
import {mountConstructorData}                  from "./helpers/mount-constructor-data";
const isEqual   = require('lodash/isEqual');

//endregion

export class Model<T extends Model<T> = any> {
	
	//region statics
	static [REACTIVE]: boolean;
	static collection_name: string;
	static fields_config: IFieldConfig[];
	static hasOnes: IHasOneDictionary;
	static hasManys: IHasManyDictionary;
	static instances: Model[];
	
	static get relationsKeys() {
		return [...Object.keys(this.hasManys), ...Object.keys(this.hasOnes)]
	}
	
	//endregion
	
	//region members
	[FIELDS]: IFieldMap = {};
	[PARENTS]: IParentConfig[] = [];
	[IS_LOADING] = true;
	_id: string
	Class: Class;
	private auto_update_DB = true;
	
	//endregion
	
	constructor(data?: Partial<T>) {
		this.Class = <Class>(this.constructor);
		if (!Entity.db) {
			throw new Error('Entity db_connector not initialized. Did you forget to run "await Entity.init()" ?')
		}
		
		if (!this.Class[REACTIVE]) {
			throw new Error(`${this.Class.name} is not a Reactive Model. Did you forget to call the @Entity() decorator?`)
		}
		
		if (!(this._id || (data && data._id))) {
			// const now = moment().utc().format('DD-MM-YY--HH:mm');
			this._id = `${this.Class.name}-${data && data['name'] || this['name'] || (data && data['name']) || ''}-${shortid.generate()}`;
		}
		
		mountConstructorData.call(this, data)
		
		return new Proxy<Model>(this, {
			deleteProperty: function (This, key) {
				if (This.Class.hasOnes[<string>key] || This.Class.hasManys[<string>key]) {
					This[key] = null
					return true
				}
				atomify(This.unset(<string>key))
				delete This[key];
				return true
			}
		})
	};
	
	get data() {
		return Object.keys(this[FIELDS])
			.reduce((pre, key) => {
				if (this[FIELDS][key].hasOne) {
					pre[key] = this[key] && this[key].data;
				}
				else if (this[FIELDS][key].hasMany) {
					pre[key] = this[key].map(m => m.data);
				}
				else {
					pre[key] = this[key]
				}
				return pre
			}, {_id: this._id})
	}
	
	get json(): string {
		return JSON.stringify(decycle(this.data))
	}
	
	static get(this: Class, _ids: string | string[]): Model {
		if (!_ids) return null;
		if (typeof _ids === 'string') {
			_ids = [_ids]
		}
		const results = <Model[]>this.instances.filter(inst => _ids.includes(inst._id));
		
		if (results.length !== _ids.length) {
			console.warn(`@Entity.get(): Cannot find some or all models with id included in ${json(_ids)} of class ${this.name}`);
		}
		return results.length ? results[0] : null
	}
	
	static async load<T extends Model>(): Promise<Model[]> {
		const
			prom    = atomify(Entity.db.list(this.collection_name)),
			results = await prom;
		
		await prom.catch(err => {
			console.error('loadAll err', err);
		});
		
		return this.instances = (results)
			.map(data => {
				const
					Class: Class = Entity.Classes
						.find(userClass => userClass.collection_name === this.collection_name);
				return new Class(data);
			})
	}
	
	async set(data: Partial<T>, save_after = true) {
		this.auto_update_DB = false;
		Object.assign(this, data)
		this.auto_update_DB = true;
		if (save_after) {
			return atomify(this.update(data))
		}
	}
	
	async unset(key: string) {
		return atomify(Entity.db.unset(this._id, this.Class.collection_name, key))
	}
	
	save = (): Promise<any> => {
		const
			parents = {'__parents__': this[PARENTS]},
			fields  = Object.keys(this[FIELDS]).reduce((pre, key) => {
				pre[key] = this[key]
				return pre
			}, {})
		
		return atomify(this.update({...this, ...fields, ...parents}, true))
	};
	
	update = async (data_or_key: Partial<Model> & { '__parents__'?: IParentConfig[], '__fields__'?: IFieldMap } | string, force_update = false): Promise<any> => {
		
		if (force_update || (!this[IS_LOADING] && this.auto_update_DB)) {
			if (typeof data_or_key === "string") {
				if (data_or_key === "parents") {
					data_or_key = {'__parents__': this[PARENTS]}
				}
				else if (this.Class.relationsKeys.includes(data_or_key)) {
					data_or_key = {[data_or_key]: this[FIELDS][data_or_key].value}
					
				}
				else { //regular @field
					data_or_key = {[data_or_key]: this[data_or_key]}
				}
			}
			const serialized_data = serializeData.call(this, {...data_or_key});
			return atomify(Entity.db.upsert({_id: this._id}, serialized_data, this.Class.collection_name))
		}
	};
	
	removeParent(parent: Model, key: string): Promise<any> | void {
		const
			parents = this[PARENTS],
			idx     = parents.findIndex(p => p._id === parent._id);
		
		if (idx === -1) {
			return console.warn(`ReactiveModels: removeParent: Cannot find ${key} parent _id ${this._id} in child ${this._id} of class ${this.Class.name}, so couldn't remove it. Weird stuff. `);
		}
		parents.splice(idx, 1)
		return atomify(this.update("parents"))
	}
	
	addParent(parent: Model, key: string): Promise<any> | void {
		const
			parents: IParentConfig[] = this[PARENTS],
			idx                      = parents.findIndex(p => p._id === parent._id),
			found                    = parents[idx];
		
		if (isEqual(found, parent)) {
			console.log(`addParent: it's the same parent!`, found._id);
			return
		}
		
		parents.push({
			_id            : parent._id,
			key,
			collection_name: parent.Class.collection_name
		})
		return atomify(this.update("parents"))
	}
	
	getParentModels(): Model[] {
		const results = this[PARENTS].map(p => Entity.Classes
			.find(c => c.collection_name === p.collection_name)
			.get(p._id));
		return (results.length && results.every(Boolean)) ? results : []
	}
	
	static load_from_data<T extends Model<T>>() {
		if (!Entity.instances_data[this.collection_name]) {
			return
		}
		this.instances = Entity.instances_data[this.collection_name]
			.map((model_data: Model) => {
				const This = new this(<T>model_data)
				This[IS_LOADING] = false;
				return This
			})
		
		Entity.instances_data[this.collection_name] = undefined
	}
	
	delete = (): Promise<void> => {
		return atomify(Entity.db.delete({_id: this._id}, this.Class.collection_name)
		                     .then(async () => {
				const parent_models = await this.getParentModels();
				for (const p of this[PARENTS]) {
					
					const
						parent_model = parent_models.find(model => model._id === p._id),
						id_ref       = <string[] | string>parent_model[p.key];
					
					if (Array.isArray(id_ref)) {
						id_ref.splice(id_ref.indexOf(p._id), 1);
					}
					else {
						parent_model[p.key] = undefined
					}
				}
				
				for (let coll_name of Object.keys(this[FIELDS]).filter(f => this[FIELDS][f].hasOne)) {
					
					const child_Class = <Class>Entity.Classes.find(cl => cl.collection_name === coll_name)
					if (!child_Class) {
						throw new Error(`Child Class not found for collection name ${json(coll_name)}`)
					}
					const
						child_id        = this[FIELDS].hasOnes[coll_name]._id,
						child_instances = child_Class.get(child_id);
					if (!child_instances) return;
					const
						index = child_instances[0][PARENTS].findIndex(p => p._id === this._id);
					
					child_instances[0][PARENTS].splice(index, 1)
				}
				await this.Class.load()
			}))
	};
	
	toJSON(key) {
		if (key) {
			return this[key]
		}
		else {
			return this.data
		}
	}
}
