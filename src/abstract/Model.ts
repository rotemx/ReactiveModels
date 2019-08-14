//region imports
import {getShortUuid} from "../utils/get-short-uuid";
import {setHasOnes} from "./set-has-ones";
import {setFields} from "./set-fields";
import {IHasOneConfig} from "../types/interfaces/i-has-one-config";
import {IField} from "../types/interfaces/i-field";
import {Entity} from "../entity";
import {Class} from "../types/types/class";
import {ParentModelConfig} from "../types/interfaces/parent-model-config";
import {setHasMany} from "./set-has-many";
import {proxyHandlerFactory} from "../utils/proxy-handler-factory";
import {json} from "../utils/jsonify";
import {flattenRelations} from "../utils/flatten-relations";
import {IHasManyConfig} from "../types/interfaces/i-has-many-config";
import moment = require("moment");

//endregion


export class Model<T extends Model<T>> {
	static collection_name: string;
	static fields: IField[];
	static hasOnes: IHasOneConfig[];
	static hasMany: IHasManyConfig[];
	static auto_update_DB: boolean = true;
	protected static instances: Model<any>[] = [];
	_hasMany = {}
	_hasOnes = {}
	is_loading = true;
	_id: string
	Class: Class;

	constructor(_data?: Partial<T>) {
		if (!Entity.db) {
			throw new Error('Entity db not initialized')
		}
		this.Class = <typeof Model>(this.constructor);
		setHasMany.call(this);
		setHasOnes.call(this);
		setFields.call(this);

		if (_data) {
			this.set(<T>_data, false)
		}
		if (!this._id) {
			this._id = `${this.Class.name}:${moment().utc().format('DD-MM-YY-HH-mm')}:${getShortUuid()}`;
		}

		this.Class.instances = this.Class.instances || [];
		this.Class.instances.push(this)
	};

	get data() {
		return [
			'_id',
			...this.Class.fields.map(f => f.key),
			...this.Class.hasOnes.map(f => f.key),
			...this.Class.hasMany.map(f => f.key)
		]
			.reduce((pre, curr) => {
				pre[curr] = this[curr];
				return pre
			}, {})
	}

	static get<T extends Model<T>>(_ids: string | string[]): Model<T>[] {
		if (!_ids) return null;
		if (typeof _ids === 'string') {
			_ids = [_ids]
		}
		return this.instances.filter(inst => _ids.includes(inst._id))
	};

	static async loadAll<T extends Model<T>>(): Promise<Model<T>[]> {
		return this.instances = (await Entity.db.list(this.collection_name))
			.map(data => {
				const
					Class: Class = Entity.Classes
						.find(userClass => userClass.collection_name === this.collection_name);
				return new Class(data)
			})
	}

	async set(data: Partial<T>, save_after = true) {
		const auto_update = this.Class.auto_update_DB;
		this.Class.auto_update_DB = false;
		Object.assign(this, data)
		this.Class.auto_update_DB = auto_update;
		if (save_after) {
			await this.update(data)
		}
	}

	save = (): Promise<any> => {
		const data = flattenRelations.call(this, this)
		return this.update(data, true)
	};

	update = (data: Partial<Model<T>>, force_update = false): Promise<any> => {
		data = flattenRelations.call(this, data)
		if (force_update || (!this.is_loading && this.Class.auto_update_DB)) {
			return Entity.db.upsert({_id: this._id}, data, this.Class.collection_name)
		}
	};

	_parents: ParentModelConfig[] = new Proxy([], proxyHandlerFactory('_parents', this.update.bind(this)))

	async getParentModels(): Promise<Model<T>[]> {
		return this.Class.get<T>(this._parents.map(p => p._id))
	}

	delete = (): Promise<any> => {
		return Entity.db.delete({_id: this._id}, this.Class.collection_name)
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
				for (let hasOne of this.Class.hasOnes || []) {
					const child_Class = Entity.Classes.find(cl => cl.collection_name === hasOne.Class.collection_name)
					if (!child_Class) {
						throw new Error(`Child Class not found for ${json(hasOne)}`)
					}
					let
						child_instance = (await child_Class.get(this[hasOne.key])),
						index          = child_instance[0]._parents.findIndex(p => p.key == this[hasOne.key]);
					child_instance[0]._parents.splice(index, 1)
				}
				await this.Class.loadAll()
			})
	};
}

