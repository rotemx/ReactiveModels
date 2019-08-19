//region imports
import {setHasOnes} from "../decorators/has-one/set-has-ones";
import {setFields} from "../decorators/field/set-fields";
import {IHasOneConfig} from "../types/interfaces/i-has-one-config";
import {IField} from "../types/interfaces/i-field";
import {Class} from "../types/types/class";
import {ParentModelConfig} from "../types/interfaces/parent-model-config";
import {setHasMany} from "../decorators/has-many/set-has-many";
import {proxyHandlerFactory} from "../utils/proxy-handler-factory";
import {json} from "../utils/jsonify";
import {removeDeepRelations} from "../decorators/utils/remove-deep-relations";
import {IHasManyConfig} from "../types/interfaces/i-has-many-config";
import {serializeData} from "../db/serialize-data";
import * as shortid from 'shortid';
import {Reactive} from "..";
// import moment from 'moment';
//
export type HasManyInstancesDic = { [key: string]: string[] };
type HasManyKeys = keyof HasManyInstancesDic;
export type HasOneInstancesDic = { [key: string]: string };

//endregion

export type PartialModel = Partial<Model<any>>;

export class Model<T extends Model<T>> {

	static __reactive__: boolean;
	static collection_name: string;
	static fields: IField[];
	static hasOnes: IHasOneConfig;
	static hasManys: IHasManyConfig;
	// static auto_update_DB: boolean = true;
	protected static instances: Model<any>[] = [];

	_hasManys: HasManyInstancesDic = {}
	_hasOnes: HasOneInstancesDic = {}
	_is_loading = true;
	_id: string
	Class: Class;
	private auto_update_DB = true;

	constructor(_data?: Partial<T>) {
		if (!Reactive.db) {
			throw new Error('Reactive db not initialized')
		}
		this.Class = <typeof Model>(this.constructor);
		if (!this.Class.__reactive__) {
			throw new Error(`${this.Class.name} is not a Reactive Model. Did you forget to call the Reactive() decorator?`)
		}
		setHasMany.call(this);
		setHasOnes.call(this);
		setFields.call(this);

		if (!this._id) {
			const date = new Date()
			this._id = `${this.Class.name}${this['name'] || ''}-:${((`${date.getFullYear()}]-${date.getMonth() + 1}-${date.getDay()}--${date.getHours()}:${date.getMinutes()}`))}:${shortid.generate()}`;
		}

		if (_data) {
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
		const results = await Reactive.db.list(this.collection_name);
		return this.instances = (results)
			.map(data => {
				const
					Class: Class = Reactive.Classes
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
		return this.update(this, true)
	};

	update = async (data: Partial<Model<T>>, force_update = false): Promise<any> => {
		if (force_update || (!this._is_loading && this.auto_update_DB)) {
			data = removeDeepRelations.call(this, data)
			const serialized_data = serializeData({...data});
			return Reactive.db.upsert({_id: this._id}, serialized_data, this.Class.collection_name)
		}
	};

	protected _parents: ParentModelConfig[] = new Proxy([], proxyHandlerFactory('_parents', this.update.bind(this)))

	removeParent(parent: Model<T>, key: string): void {
		let idx = this._parents.findIndex(p => p._id === parent._id);
		if (idx === -1) {
			console.warn(`ReactiveModels: removeParent: Cannot find ${key} parent _id ${this._id} in child ${this._id} of class ${this.Class.name}, so cannot remove it. Weird. `);
			return
		}
		this._parents.splice(idx, 1)
	}

	addParent(parent: Model<T>, key: string): void {
		let idx = this._parents.findIndex(p => p._id === this._id);
		if (idx > -1) {
			console.warn(`ReactiveModels: setParent: Found old ${key} parent _id ${this._id} in child ${this._id} of class ${this.Class.name}. Weird. `);
			this._parents.splice(idx, 1)
		}
		this._parents.push({
			_id            : parent._id,
			key,
			collection_name: parent.Class.collection_name
		})
	}

	getParents(): Model<T>[] {
		return this._parents.map(parent_config => {
			const
				parent_Class: Class = Reactive.Classes.find(c => c.collection_name === parent_config.collection_name),
				result              = parent_Class.get<T>(parent_config._id);

			return result.length ? result[0] : null
		}).filter(Boolean)

	}

	async getParentModels(): Promise<Model<T>[]> {
		return this.Class.get<T>(this._parents.map(p => p._id))
	}

	delete = (): Promise<void> => {
		return Reactive.db.delete<T>({_id: this._id}, this.Class.collection_name)
			.then(async () => {
				const parent_models = await this.getParentModels();
				for (const p of this._parents) {
					const parent_model = parent_models.find(model => model._id === p._id);
					const id_ref = <string[] | string>parent_model[p.key];
					if (Array.isArray(id_ref)) {
						id_ref.splice(id_ref.indexOf(p._id), 1);
					} else {
						parent_model[p.key] = undefined
					}
				}

				for (let coll_name of Object.keys(this._hasOnes)) {
					const child_Class = <Class>Reactive.Classes.find(cl => cl.collection_name === coll_name)
					if (!child_Class) {
						throw new Error(`Child Class not found for collection name ${json(coll_name)}`)
					}
					const
						child_id        = this._hasOnes[coll_name],
						child_instances = child_Class.get<T>(child_id);
					if (!child_instances.length) return;
					const
						index = child_instances[0]._parents.findIndex(p => p._id === this._id);

					child_instances[0]._parents.splice(index, 1)
				}
				await this.Class.loadAll()
			})
	};
}

