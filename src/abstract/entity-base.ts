//region imports
import {IdbConnector} from "../types/interfaces/idb-connector";
import {getShortUuid} from "../utils/get-short-uuid";
import {Entity} from "../decorators/entity-decorator";

//endregion

export class EntityBase<T> {
    protected db: IdbConnector;
    protected static db: IdbConnector;

    protected collection_name: string;
    protected static collection_name: string;
    fields: string[] = [];

    static instances: object[] = [];

    static async load<T extends EntityBase<T>>(): Promise<object[]> {
        return this.instances = (await Entity.db.list(this.collection_name))
            .map(data => {
                const
                    Class = Entity.classes[this.collection_name].Class,
                    instance: T = new Class(data._id);
                instance.set(data)
                return instance
            })
    }

    async set(data: Partial<T>) {
        let auto_update = this.auto_update_DB;
        this.auto_update_DB = false;
        Object.assign(this, data)
        this.auto_update_DB = auto_update;
        this.upsert(data)
    }

    constructor(public _id?: string, public auto_update_DB = true) {
        // if (!Entity.db) {throw new Error('Entity db not initialized')}
        this.db = Entity.db;
        const
            proto = this['__proto__'];

        this.auto_update_DB = false;

        this.collection_name = proto.constructor.collection_name
        this.fields = proto.constructor.fields || []

        if (!this._id) {
            this._id = getShortUuid();
            this.save()
        }

        for (const key of this.fields) {
            (() => {
                let value;
                Object.defineProperty(this, key, {
                    enumerable: true,
                    get       : () => value,
                    set       : (new_val) => {
                        const class_name = this['__proto__'].constructor.name;
                        value = new_val;
                        if (this.auto_update_DB) {
                            console.log(`Upserting class ${class_name} with key ${key} value ${new_val}`);
                            this.upsert({[key]: new_val})
                        }
                    }
                })
            })();
        }
        this.auto_update_DB = auto_update_DB;
    };

    save = (): Promise<any> => {
        return this.db.upsert({_id: this._id}, this, this.collection_name)
    };


    upsert = (data: { [field: string]: any }): Promise<any> => {
        return this.db.upsert({_id: this._id}, data, this.collection_name)
    };

    delete = (): Promise<any> => {
        return this.db.delete({_id: this._id}, this.collection_name)
    };

    get data() {
        return ['_id', ...this.fields].reduce((pre, curr) => {
            pre[curr] = this[curr];
            return pre
        }, {})
    }
}
