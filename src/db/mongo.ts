import {Db, MongoClient} from 'mongodb';
import {Log} from "../utils/Log";
import {logErr} from "../utils/log-err";
import {IdbConnector} from "../types/interfaces/idb-connector";
import {IDBOptions} from "../types/interfaces/idb-options";
import {serializeData} from "../utils/serialize-data";
import {EntityBase} from "../abstract/entity-base";

export class Mongo implements IdbConnector {
    client: MongoClient;
    db: Db;
    master_client: MongoClient;
    master_url: string;

    init({hostname = 'localhost', port = 27017, url, master_url, username = '', pwd = '', db_name = 'EntityModel', authenticated}: IDBOptions): Promise<any> {
        this.master_url = master_url;

        const
            full_url = url || `mongodb://${username}:${pwd}@${hostname}:${port}/?authMechanism=DEFAULT`;

        return MongoClient
            .connect(full_url, {useNewUrlParser: true})
            .then((client) => {
                [this.client, this.db] = [client, client.db(db_name)];
                Log(`Connected successfully to mongo DB at ${hostname}\n`, 'Mongo/init');
                return Promise.resolve(this)
            })
            .catch(err => {
                logErr(err);
                return Promise.reject(err);
            });
    }

    async getMasterClient(): Promise<MongoClient> {
        return this.master_client || await MongoClient.connect(this.master_url)
            .then((client: MongoClient) => {
                this.master_client = client;
                Log(`Connected successfully to MASTER mongo DB at ${this.master_url}\n`, 'Mongo/getMasterClient');
                return client;
            })
            .catch(err => {
                logErr(err);
                return Promise.reject(err);
            });
    }

    upsert<T extends EntityBase<T>>(query: { _id: string, [prop: string]: any }, data: Partial<T>, collection_name: string): Promise<any> {
        if (!query || !collection_name) return Promise.reject('Mongo/update: no item provided.');
        if (!query._id) {
            throw new Error('_id was not specified in upsert')
        }
        return this
            .db
            .collection(collection_name)
            .updateOne(query, {$set: serializeData<T>(<T>{...data, _id: query._id}),}, {upsert: true});
    }


    delete(item, collection_name: string): Promise<any> {
        if (!item) return Promise.reject('Mongo/delete: no item provided.');
        return this
            .db
            .collection(collection_name)
            .deleteOne({_id: item._id});
    }

    async close() {
        this.client && this.client.close();
    }

    async list(collection: string): Promise<any> {
        if (!collection) return Promise.reject('Mongo/list: no collection name provided.');
        if (!this.db.collection(collection)) {
            Log(`db.collection ${collection} is undefined !`, 'WTF');
            return Promise.reject('Mongo/list: no collection name provided.');
        }
        Log(`MongoDB:list`);
        return this.db.collection(collection)
            .find({}).toArray();
    }
}
