//region imports
import {getShortUuid} from "../utils/get-short-uuid";
import {setHasOnes} from "./set-has-ones";
import {setFields} from "./set-fields";
import {IHasOne} from "../types/interfaces/i-has-ones";
import {IField} from "../types/interfaces/i-field";
import {Entity} from "../entity";
import {Class} from "../types/types/class";
import {ParentModelConfig} from "../types/interfaces/parent-model-config";
import {setHasMany} from "./set-has-many";
import {proxyHandlerFactory} from "../utils/proxy-handler-factory";
import moment = require("moment");
//endregion


export class Model<T> {

	_id:string
    Class: typeof Model;

    async set(data: Partial<T>, save_after = true) {
        const auto_update = this.auto_update_DB;
        this.auto_update_DB = false;
        Object.assign(this, data)
        this.auto_update_DB = auto_update;
	    if (save_after) {
		    await this.update(data)
	    }
    }
	
	constructor(private _data?: Partial<Model<T>>, public auto_update_DB = true) {
        if (!Entity.db) {
            throw new Error('Entity db not initialized')
        }
        this.Class = <typeof Model>(this.constructor);
		
        if (_data){
        	this.set(<T>_data,false)
        }
        else{
            this._id = `${this.Class.name}:${moment().utc().format('DD-MM-YY-HH-mm')}:${getShortUuid()}`;
            this.save()
        }
        
        this.Class.instances = this.Class.instances || [];
        this.Class.instances.push(this)
        setHasMany.call(this);
        setHasOnes.call(this);
        setFields.call(this);
    };


    save = (): Promise<any> => {
        return Entity.db.upsert({_id: this._id}, this, this.Class.collection_name)
    };

    update = (data: { [field: string]: any }): Promise<any> => {
        return Entity.db.upsert({_id: this._id}, data, this.Class.collection_name)
    };

    async getParentModels<T>(): Promise<Model<T>[]> {
        return this.Class.get<T>(this.parents.map(p => p._id))
    }

    delete = (): Promise<any> => {
        return Entity.db.delete({_id: this._id}, this.Class.collection_name)
            .then(async () => {
                const parent_models = await this.getParentModels<T>();
                for (const p of this.parents) {
                    const parent_model = parent_models.find(model => model._id === p._id);
                    const id_ref = <string[] | string>parent_model[p.key];
                    if (Array.isArray(id_ref)) {
                        id_ref.splice(id_ref.indexOf(p._id), 1);
                    } else {
                        parent_model[p.key] = null
                    }
                }
                await this.Class.loadAll()
            })
    };

    parents: ParentModelConfig[] = new Proxy([], proxyHandlerFactory('parents', this.update.bind(this)))


    get data() {
        return ['_id', ...this.Class.fields.map(f => f.key)].reduce((pre, curr) => {
            pre[curr] = this[curr];
            return pre
        }, {})
    }

    static collection_name: string;

    static async get<T>(_ids: string | string[]): Promise<Model<T>[]> {
        if (!_ids) return null;
        if (typeof _ids === 'string') {
            _ids = [_ids]
        }
        return this.instances.filter(inst => _ids.includes(inst._id))
    };

    static async loadAll(): Promise<Model<any>[]> {
        return this.instances = (await Entity.db.list(this.collection_name))
            .map(data => {
                const
                    Class: Class = Entity.Classes
                        .find(userClass => userClass.collection_name === this.collection_name),
                    instance = new Class(data);
                return instance
            })
    }


    protected static instances: Model<any>[] = [];
    static fields: IField[];
    static hasOnes: IHasOne[];
    static hasMany: IHasOne[];
}

