//region imports
import {Db, MongoClient} from 'mongodb';
import {logErr} from "../utils/log-err";
import {IDbConnector} from "./i-db-connector";
import {IDbConfig} from "./i-db-config";
import {Model} from "..";
import {json} from "../utils/jsonify";
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
	private db: Db;

	private config: IDbConfig;

	init(config: IDbConfig = DEFAULT_CONFIG): Promise<any> {
		this.config = {...DEFAULT_CONFIG, ...config};

		const
			{url, username, hostname, port, pwd, db_name} = this.config,
			full_url                                      = url || `mongodb://${username}:${pwd}@${hostname}:${port}/?authMechanism=DEFAULT`;

		return MongoClient
			.connect(full_url, {useNewUrlParser: true, useUnifiedTopology: true})
			.then((client) => {
				[this.client, this.db] = [client, client.db(db_name)];
				console.log(`Mongo/init: Connected successfully to mongo DB at ${hostname}`);
				return Promise.resolve(this)
			})
			.catch(err => {
				logErr(err);
				return Promise.reject(err);
			});
	}

	upsert<T extends Model<T>>(query: { _id: string, [prop: string]: any }, data: Partial<T>, collection_name: string): Promise<any> {
		if (!query || !collection_name) return Promise.reject('Mongo/update: no item provided.');
		if (!query._id) {
			throw new Error('_id was not specified in upsert')
		}
		console.log(`> Upserting \t\t ${collection_name} \t\t ${query._id} \t \t ${json(data)} \t\t`);

		return this
			.db
			.collection(collection_name)
			.updateOne(query, {$set: data}, {upsert: true})
			.catch(err=>{
				console.error('upsert err', err);
			})
	}

	delete<T extends Model<T>>(item: Model<T>, collection_name: string): Promise<any> {
		if (!item) return Promise.reject('Mongo/delete: no item provided.');
		return this
			.db
			.collection(collection_name)
			.deleteOne({_id: item._id});
	}

	async close() {
		this.client && this.client.close();
	}

	async list(collection_name: string, ids?: string[]): Promise<Model<any>[]> {
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
}
