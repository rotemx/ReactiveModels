//region imports
import {IHasOneConfig} from "../decorators/has-one/i-has-one-config";
import {IFieldConfig} from "../decorators/field/i-field-config";
import {Class} from "./types/class";
import {json} from "../utils/jsonify";
import {IHasManyConfig} from "../decorators/has-many/i-has-many-config";
import {serializeData} from "../db/serialize-data";
import * as shortid from 'shortid';
import {Entity} from "..";
import {IFieldMap} from "./types/i-field-map";
import {FIELDS, PARENTS} from "./helpers/model-helpers";
import {IParentConfig} from "./types/i-parent-config";
import {isEqual} from "lodash";
import moment = require("moment");

//endregion

export class Model {

	//region statics
	static __reactive__: boolean;
	static collection_name: string;
	static fields: IFieldConfig[];
	static hasOnes: IHasOneConfig;
	static hasManys: IHasManyConfig;
	static instances: Model[];

	static get relationsKeys() {
		return [...Object.keys(this.hasManys), ...Object.keys(this.hasOnes)]
	}

	//endregion

	//region members
	[FIELDS]: IFieldMap = {};
	[PARENTS]: IParentConfig[] = []

	_is_loading = true;
	_id: string
	Class: Class;
	private auto_update_DB = true;

	//endregion

	constructor(_data?: any) {
		if (!Entity.db) {
			throw new Error('Entity db not initialized. Did you forget to run "await Entity.init()" ?')
		}
		this.Class = <typeof Model>(this.constructor);

		if (!this.Class.__reactive__) {
			throw new Error(`${this.Class.name} is not a Reactive Model. Did you forget to call the @Reactive() decorator?`)
		}

		if (!(this._id || (_data && _data._id))) {
			const now = moment().utc().format('DD-MM-YY--HH:mm');
			this._id = `${this.Class.name}-${this['name'] || (_data && _data['name']) || ''}-${shortid.generate()}`;
		}

		if (_data) {
			if (_data._id) {
				this._id = _data._id
			}
			if (_data['__parents__']) {
				this[PARENTS] = _data['__parents__']
				delete _data['__parents__'];
			}

			[...this.Class.fields.map(f => f.key),
			 ...Object.keys(this.Class.hasManys),
			 ...Object.keys(this.Class.hasOnes),
			].forEach((key) => {
				const value = _data[key];
				if (value !== undefined) {
					this[FIELDS][key] = {
						value  : value,
						proxy  : null,
						hasMany: !!this.Class.hasManys[key],
						hasOne : !!this.Class.hasOnes[key],
						init   : true
					}
				}
			});

			//this.set(_data, false)
		}
		this.Class.instances.push(this)
	};

	get data() {
		const res = [
			'_id',
			...this.Class.fields.map(f => f.key),
		]
			.reduce((pre, curr) => {
				const value = this[curr];
				if (value !== null && value !== undefined) {
					pre[curr] = value;
				}
				return pre
			}, {})

		Object.assign(res, [
			...Object.keys(this.Class.hasOnes),
			...Object.keys(this.Class.hasManys),
		]
			.reduce((pre, curr) => {
				const value = this[curr];
				if (value !== null && value !== undefined) {
					pre[curr] = Array.isArray(value) ? value.map(m => m.data) : value.data;
				}
				return pre
			}, {}))

		return res
	}

	static get(this: Class, _ids: string | string[]): Model {
		if (!_ids) return null;
		if (typeof _ids === 'string') {
			_ids = [_ids]
		}
		const results = <Model[]>this.instances.filter(inst => _ids.includes(inst._id));

		if (results.length !== _ids.length) {
			console.warn(`Cannot find some or all child model with id included in ${json(_ids)} of class ${this.name}`);
		}
		return results.length && results[0]
	};

	static async loadAll<T extends Model>(): Promise<Model[]> {
		const
			prom    = Entity.db.list(this.collection_name),
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

	async set(data: object, save_after = true) {
		this.auto_update_DB = false;
		Object.assign(this, data)
		this.auto_update_DB = true;
		if (save_after) {
			await this.update(data)
		}
	}

	save = (): Promise<any> => {
		const
			parents = {'__parents__': this[PARENTS]},
			fields  = Object.keys(this[FIELDS]).reduce((pre, key) => {
				pre[key] = this[key]
				return pre
			}, {})

		return this.update({...this, ...fields, ...parents}, true)
	};

	update = async (data_or_key: Partial<Model> & { '__parents__'?: IParentConfig[], '__fields__'?: IFieldMap } | string, force_update = false): Promise<any> => {


		if (force_update || (!this._is_loading && this.auto_update_DB)) {
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
			return Entity.db.upsert({_id: this._id}, serialized_data, this.Class.collection_name)
		}
	};

	removeParent(parent: Model, key: string): void {
		const
			parents = this[PARENTS],
			idx     = parents.findIndex(p => p._id === parent._id);

		if (idx === -1) {
			return console.warn(`ReactiveModels: removeParent: Cannot find ${key} parent _id ${this._id} in child ${this._id} of class ${this.Class.name}, so couldn't remove it. Weird stuff. `);
		}
		parents.splice(idx, 1)
		this.update("parents")
	}

	addParent(parent: Model, key: string): void {
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
		this.update("parents")
	}

	async getParentModels(): Promise<Model[]> {
		const parents = this[PARENTS];
		return parents.map(par => Entity.Classes
			.find(c => c.collection_name === par.collection_name)
			.get(par._id))
	}

	delete = (): Promise<void> => {
		return Entity.db.delete({_id: this._id}, this.Class.collection_name)
			.then(async () => {
				const parent_models = await this.getParentModels();
				for (const p of this[PARENTS]) {
					const parent_model = parent_models.find(model => model._id === p._id);
					const id_ref = <string[] | string>parent_model[p.key];
					if (Array.isArray(id_ref)) {
						id_ref.splice(id_ref.indexOf(p._id), 1);
					}
					else {
						parent_model[p.key] = undefined
					}
				}

				for (let coll_name of Object.keys(this[FIELDS].hasOnes)) {
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
				await this.Class.loadAll()
			})
	};
}
