//region imports
import {MongoMemoryServer}    from 'mongodb-memory-server';
import {Entity, field, Model} from "..";
import {MONGO_CONFIG}         from "../CONFIG";
//endregion

const mongoServer = new MongoMemoryServer();

describe('@field', () => {
	let
		url,
		port,
		db_path,
		db_name;
	
	beforeAll(async () => {
		url = await mongoServer.getConnectionString();
		port = await mongoServer.getPort();
		db_path = await mongoServer.getDbPath();
		db_name = await mongoServer.getDbName();
		await Entity.init({
			db_config: {
				url,
				db_name,
				port,
				username: MONGO_CONFIG.user,
				pwd     : MONGO_CONFIG.pwd
			}
		})
	})
	
	beforeEach(async () => {
		await Entity.clear_db()
		
	});
	
	afterEach(async () => {
	});
	
	afterAll(async () => {
		await mongoServer.stop()
	})
	
	
	test('Create an entity', async () => {
		@Entity()
		class Person extends Model {
		}
		
		const
			person      = new Person(),
			collections = (await Entity.db_connector.list_collections()),
			collection  = Entity.db_connector.db.collection(Person.collection_name),
			instances   = await collection.find({}).toArray();
		
		process.nextTick(async () => {
			expect(Person.instances[0] === person).toBeTruthy();
			expect(collections).toEqual(['Person'])
			expect(instances.length).toEqual(1);
			expect((<Person>instances[0])._id).toBeTruthy();
			expect(instances)
				.toEqual(expect.arrayContaining([expect.objectContaining({
					'__parents__': []
				})]))
		})
		
	})
	
	test('Delete an entity', async () => {
		@Entity()
		class Person extends Model {
			@field name: string;
			@field age: number;
		}
		
		const
			person     = new Person({name: 'person', age: 30}),
			collection = Entity.db_connector.db.collection(Person.collection_name);
		
		await person.delete()
		
		const
			instances = await collection.find({}).toArray();
		
		setTimeout(() => {
			expect(instances.length).toEqual(0)
		}, 500)
	})
	
	test('Delete an entity', async () => {
		@Entity()
		class Person extends Model {
			@field name: string;
			@field age: number;
		}
		
		const
			person     = new Person({name: 'person', age: 30}),
			collection = Entity.db_connector.db.collection(Person.collection_name);
		
		await person.delete()
		
		const
			instances = await collection.find({}).toArray();
		
		setTimeout(() => {
			expect(instances.length).toEqual(0)
		}, 500)
	})
})
