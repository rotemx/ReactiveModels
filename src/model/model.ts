//region imports
import {setHasOnes} from "../decorators/has-one/set-has-ones";
import {setField, setFields} from "../decorators/field/set-fields";
import {IHasOneConfig} from "../decorators/has-one/i-has-one-config";
import {IFieldConfig} from "../decorators/field/i-field-config";
import {Class} from "./types/class";
import {setHasMany} from "../decorators/has-many/set-has-many";
import {json} from "../utils/jsonify";
import {serializeRelationData} from "../decorators/utils/serialize-relation-data";
import {IHasManyConfig} from "../decorators/has-many/i-has-many-config";
import {serializeData} from "../db/serialize-data";
import * as shortid from 'shortid';
import {Entity} from "..";
import {IModelInternals} from "./types/i-model-internals";
import {INT} from "./helpers/model-helpers";
import moment = require("moment");

//endregion

export class Model<T extends Model<T>> {

	static __reactive__: boolean;
	static collection_name: string;
	static fields: IFieldConfig[];
	static hasOnes: IHasOneConfig;
	static hasManys: IHasManyConfig;
	static instances: Model<any>[];

	protected updateINT() {
		this.update({_internals: this[INT]})
	}

	[INT]: IModelInternals = {};

	_is_loading = true;
	_id: string
	Class: Class;
	private auto_update_DB = true;
	values: Map<string, any>;


	constructor(_data?: Partial<T>) {
		if (!Entity.db) {
			throw new Error('Entity db not initialized. Did you forget to run await Entity.init() ?')
		}
		this.Class = <typeof Model>(this.constructor);
		if (!this.Class.__reactive__) {
			throw new Error(`${this.Class.name} is not a Reactive Model. Did you forget to call the @Reactive() decorator?`)
		}

		setField(this[INT], {key: 'hasManys', type: Object}, this.updateINT.bind(this), {})
		setField(this[INT], {key: 'hasOnes', type: Object}, this.updateINT.bind(this), {})
		setField(this[INT], {key: 'parents', type: Array}, this.updateINT.bind(this), [])

		setHasMany.call(this);
		setHasOnes.call(this);
		setFields.call(this);


		if (!this._id) {
			this._id = `${this.Class.name}${this['name'] || ''}-:${moment().utc().format('DD-MM-YY--HH:mm')}:${shortid.generate()}`;
		}

		if (_data) {
			if (_data['_internals']) {
				this[INT] = _data['_internals']
				_data['_internals'] = undefined;
			}
			this.set(<T>_data, false)
		}

		this.Class.instances = this.Class.instances || [];
		this.Class.instances.push(this)
	};

	get data() {
		return [
			'_id',
			...this.Class.fields.map(f => f.key),
			...Object.keys(this.Class.hasOnes),
			...Object.keys(this.Class.hasManys),
		]
			.reduce((pre, curr) => {
				pre[curr] = this[curr];
				return pre
			}, {})
	}

	static get<T extends Model<T>>(this: Class, _ids: string | string[]): Model<T>[] {
		if (!_ids) return null;
		if (typeof _ids === 'string') {
			_ids = [_ids]
		}
		const results = <Model<T>[]>this.instances.filter(inst => _ids.includes(inst._id));

		if (results.length !== _ids.length) {
			console.warn(`Cannot find some or all child model with id included in ${json(_ids)} of class ${this.name}`);
		}
		return results
	};

	static async loadAll<T extends Model<T>>(): Promise<Model<T>[]> {
		const results = await Entity.db.list(this.collection_name);
		return this.instances = (results)
			.map(data => {
				const
					Class: Class = Entity.Classes
						.find(userClass => userClass.collection_name === this.collection_name);
				return new Class(data)
			})
	}

	async set(data: Partial<T>, save_after = true) {
		this.auto_update_DB = false;
		Object.assign(this, data)
		this.auto_update_DB = true;
		if (save_after) {
			await this.update(data)
		}
	}

	save = (): Promise<any> => {
		return this.update({...this, _internals: this[INT]}, true)
	};

	update = async (data: Partial<Model<T> & { _internals?: IModelInternals }>, force_update = false): Promise<any> => {
		if (force_update || (!this._is_loading && this.auto_update_DB)) {
			data = serializeRelationData.call(this, data)
			const serialized_data = serializeData({...data});
			return Entity.db.upsert({_id: this._id}, serialized_data, this.Class.collection_name)
		}
	};

	removeParent(parent: Model<T>, key: string): void {
		let idx = this[INT].parents.findIndex(p => p._id === parent._id);
		if (idx === -1) {
			console.warn(`ReactiveModels: removeParent: Cannot find ${key} parent _id ${this._id} in child ${this._id} of class ${this.Class.name}, so cannot remove it. Weird. `);
			return
		}
		this[INT].parents.splice(idx, 1)
	}

	addParent(parent: Model<T>, key: string): void {
		let idx = this[INT].parents.findIndex(p => p._id === this._id);
		if (idx > -1) {
			console.warn(`ReactiveModels: setParent: Found old ${key} parent _id ${this._id} in child ${this._id} of class ${this.Class.name}. Weird. `);
			this[INT].parents.splice(idx, 1)
		}
		this[INT].parents.push({
			_id            : parent._id,
			key,
			collection_name: parent.Class.collection_name
		})
	}

	async getParentModels(): Promise<Model<T>[]> {
		return this.Class.get<T>(this[INT].parents.map(p => p._id))
	}

	delete = (): Promise<void> => {
		return Entity.db.delete<T>({_id: this._id}, this.Class.collection_name)
			.then(async () => {
				const parent_models = await this.getParentModels();
				for (const p of this[INT].parents) {
					const parent_model = parent_models.find(model => model._id === p._id);
					const id_ref = <string[] | string>parent_model[p.key];
					if (Array.isArray(id_ref)) {
						id_ref.splice(id_ref.indexOf(p._id), 1);
					} else {
						parent_model[p.key] = undefined
					}
				}

				for (let coll_name of Object.keys(this[INT].hasOnes)) {
					const child_Class = <Class>Entity.Classes.find(cl => cl.collection_name === coll_name)
					if (!child_Class) {
						throw new Error(`Child Class not found for collection name ${json(coll_name)}`)
					}
					const
						child_id        = this[INT].hasOnes[coll_name],
						child_instances = child_Class.get<T>(child_id);
					if (!child_instances.length) return;
					const
						index = child_instances[0][INT].parents.findIndex(p => p._id === this._id);

					child_instances[0][INT].parents.splice(index, 1)
				}
				await this.Class.loadAll()
			})
	};
}
