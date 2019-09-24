//region imports
import {Db, MongoClient} from 'mongodb';
import {IDbConnector}    from "./i-db-connector";
import {IDbConfig}       from "./i-db-config";
import {Model}           from "..";
import {json}            from "../utils/jsonify";
//endregion

const DEFAULT_CONFIG = {
	hostname     : 'localhost',
	port         : 27017,
	url          : '',
	master_url   : '',
	username     : '',
	pwd          : '',
	db_name      : 'ReactiveModels',
	authenticated: true
};

export class Mongo implements IDbConnector {
	client: MongoClient;
	db: Db;
	
	private config: IDbConfig;
	
	async init(config: IDbConfig = DEFAULT_CONFIG): Promise<any> {
		this.config = {...DEFAULT_CONFIG, ...config};
		
		const
			{url, username, hostname, port, pwd, db_name} = this.config,
			full_url                                      = url || `mongodb://${username && pwd ? `${username}:${pwd}@` : ''}${hostname}:${port}/?authMechanism=DEFAULT`;
		
		this.client = config.mongo_client || await MongoClient.connect(full_url, {
			useNewUrlParser   : true,
			useUnifiedTopology: true
		})
		this.db = this.client.db(db_name);
		console.log(`Mongo/init: Connected successfully to mongo DB at ${hostname}:${port} `);
	}
	
	upsert<T extends Model>(query: { _id: string, [prop: string]: any }, data: object, collection_name: string): Promise<any> {
		if (!query || !collection_name) return Promise.reject('Mongo/update: no item provided.');
		if (!query._id) {
			throw new Error('_id was not specified in upsert')
		}
		console.log(`> Upserting \t\t ${collection_name} \t\t ${query._id} \t \t ${json(data)} \t\t`);
		
		return this
			.db
			.collection(collection_name)
			.updateOne(query, {$set: data}, {upsert: true})
			.catch(err => {
				console.error('upsert err', err);
			})
	}
	
	async unset(id: string, collection_name, key) {
		if (!id || !collection_name) return Promise.reject('Mongo/update: no id or collection name provided.');
		console.log(`> Unsetting \t\t ${collection_name} \t\t ${id} \t \t key: ${key} \t\t`);
		return this
			.db
			.collection(collection_name)
			.updateOne({_id: id}, {$unset: {[key]: 1}})
			.catch(err => {
				console.error('unset err', err);
			})
	}
	
	delete<T extends Model>(item: Model, collection_name: string): Promise<any> {
		if (!item) return Promise.reject('Mongo/delete: no item provided.');
		return this
			.db
			.collection(collection_name)
			.deleteOne({_id: item._id});
	}
	
	async close() {
		this.client && this.client.close();
	}
	
	async list(collection_name: string, ids?: string[]): Promise<Model[]> {
		if (!collection_name) return Promise.reject('Mongo/list: no collection name provided.');
		if (!this.db.collection(collection_name)) {
			console.error(`db.collection ${collection_name} is undefined!`, 'WTF');
			return Promise.reject('Mongo:list : no collection name provided.');
		}
		return (await this
			.db
			.collection(collection_name)
			.find(ids ? {_id: {$in: ids}} : {})
			.toArray()) || [];
	}
	
	async delete_db(): Promise<any> {
		return this.db.dropDatabase()
	}
	
	async list_collections(): Promise<string[]> {
		return (await this
			.db
			.listCollections({}, {nameOnly: true})
			.toArray())
			.map(coll => coll.name)
	}
}
