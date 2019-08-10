//region imports
import {getShortUuid} from "../utils/get-short-uuid";
import {setHasOnes} from "./set-has-ones";
import {setFields} from "./set-fields";
import {IHasOne} from "../types/interfaces/i-has-ones";
import {IField} from "../types/interfaces/i-field";
import {Entity, UserClass} from "../entity";

//endregion


export class Model<T> {

    isOneOf: {collection_name:string,key:string, id:string}[] = []
    Class: typeof Model;

    async set(data: Partial<T>) {
        let auto_update = this.auto_update_DB;
        this.auto_update_DB = false;
        Object.assign(this, data)
        this.auto_update_DB = auto_update;
        this.update(data)
    }

    constructor(public _id?: string, public auto_update_DB = true) {
        if (!Entity.db) {
            throw new Error('Entity db not initialized')
        }

        this.auto_update_DB = false;
        this.Class = <typeof Model>(this.constructor);

        if (!this._id) {
            this._id = getShortUuid();
            this.save()
        }
        this.Class.instances = this.Class.instances || [];
        this.Class.instances.push(this)

        setHasOnes.call(this);
        setFields.call(this);

        this.auto_update_DB = auto_update_DB;
    };


    save = (): Promise<any> => {
        return Entity.db.upsert({_id: this._id}, this, this.Class.collection_name)
    };

    update = (data: { [field: string]: any }): Promise<any> => {
        return Entity.db.upsert({_id: this._id}, data, this.Class.collection_name)
    };

    delete = (): Promise<any> => {
        return Entity.db.delete({_id: this._id}, this.Class.collection_name)
            .then(async () => {
                await this.Class.load()
                // Entity.get(this._id)[this.isOneOf.key ]
            })
    };

    get data() {
        return ['_id', ...this.Class.fields.map(f => f.key)].reduce((pre, curr) => {
            pre[curr] = this[curr];
            return pre
        }, {})
    }


    static collection_name: string;

    static async load(): Promise<object[]> {
        return this.instances = (await Entity.db.list(this.collection_name))
            .map(data => {
                const
                    UserClass: UserClass = Entity.user_classes
                        .find(userClass => userClass.collection_name === this.collection_name),
                    instance = new UserClass(data._id);

                instance.set(data)
                return instance
            })
    }

    static instances: Model<any>[] = [];
    static fields: IField[] = [];
    static hasOnes: IHasOne[] = [];
    static hasMany: IHasOne[] = [];
}

