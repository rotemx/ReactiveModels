//region imports
import {IHasOneConfig} from "../decorators/has-one/i-has-one-config";
import {IFieldConfig} from "../decorators/field/i-field-config";
import {Class} from "./types/class";
import {json} from "../utils/jsonify";
import {serializeRelationData} from "../decorators/utils/serialize-relation-data";
import {IHasManyConfig} from "../decorators/has-many/i-has-many-config";
import {serializeData} from "../db/serialize-data";
import * as shortid from 'shortid';
import {Entity} from "..";
import {IModelInternals} from "./types/i-model-internals";
import {serializeInternals} from "./helpers/serialize-internals";
import {INT} from "./helpers/model-helpers";
import {isEqual} from 'lodash'
import moment = require("moment");

//endregion

export class Model<T extends Model<T>> {

	static __reactive__: boolean;
	static collection_name: string;
	static fields: IFieldConfig[];
	static hasOnes: IHasOneConfig;
	static hasManys: IHasManyConfig;
	static instances: Model<any>[];

	updateInternals(prop: keyof IModelInternals) {
		let data = this[INT][prop];
		this.update({[`__${prop}__`]: data})
	}

	[INT]: IModelInternals = {
		values  : {},
		parents : [],
		hasManys: {},
		hasOnes : {}
	};

	_is_loading = true;
	_id: string
	Class: Class;
	private auto_update_DB = true;


	constructor(_data?: Partial<T>) {
		if (!Entity.db) {
			throw new Error('Entity db not initialized. Did you forget to run await Entity.init() ?')
		}
		this.Class = <typeof Model>(this.constructor);
		if (!this.Class.__reactive__) {
			throw new Error(`${this.Class.name} is not a Reactive Model. Did you forget to call the @Reactive() decorator?`)
		}

		// const Int = this[INT];
		// setField(Int, {key: 'hasManys', type: Object}, this.updateInternals.bind(this, "hasManys"), {})
		// setField(Int, {key: 'hasOnes', type: Object}, this.updateInternals.bind(this, "hasOnes"), {})
		// setField(Int, {key: 'parents', type: Array}, this.updateInternals.bind(this, "parents"), [])

		if (!this._id) {
			const now = moment().utc().format('DD-MM-YY--HH:mm');
			this._id = `${this.Class.name}-${this['name'] || _data['name'] || ''}-${shortid.generate()}`;
		}

		if (_data) {
			const internals_props: (keyof IModelInternals)[] = ['hasManys', 'hasOnes', 'parents'];

			internals_props.forEach(prop => {
				if (_data[`__${prop}__`]) {
					this[INT][prop] = _data[`__${prop}__`]
					_data[`__${prop}__`] = undefined
				}
			})

			this.set(_data, false)
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
		return this.update({...this, ...serializeInternals(this)}, true)
	};

	update = async (data: Partial<Model<T>>, force_update = false): Promise<any> => {
		if (force_update || (!this._is_loading && this.auto_update_DB)) {
			data = serializeRelationData.call(this, data)
			const serialized_data = serializeData({...data});
			return Entity.db.upsert({_id: this._id}, serialized_data, this.Class.collection_name)
		}
	};

	removeParent(parent: Model<T>, key: string): void {
		const
			parents = this[INT].parents,
			idx     = parents.findIndex(p => p._id === parent._id);

		if (idx === -1) {
			return console.warn(`ReactiveModels: removeParent: Cannot find ${key} parent _id ${this._id} in child ${this._id} of class ${this.Class.name}, so couldn't remove it. Weird stuff. `);
		}
		parents.splice(idx, 1)
		this.updateInternals("parents")
	}

	addParent(parent: Model<T>, key: string): void {
		const
			Internals: IModelInternals = this[INT],
			idx                        = Internals.parents.findIndex(p => p._id === parent._id),
			found                      = Internals.parents[idx];

		if (isEqual(found, parent)) {
			console.log(`addParent: it's the same parent!`, found._id);
			return
		}
		if (found) {
			console.warn(`ReactiveModels: addParent: Found old ${key} parent _id ${this._id} in child ${this._id} of class ${this.Class.name}. Weird stuff. `);
			Internals.parents.splice(idx, 1)
		}
		Internals.parents.push({
			_id            : parent._id,
			key,
			collection_name: parent.Class.collection_name
		})
		this.updateInternals("parents")
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
