//region imports
import {Entity, field, Model}                     from "..";
import {atomic}                                   from "../functions/atomic";
import {Class}                                    from "../model/types/class";
import {TEST_INIT_OPTS, mongoServer, resetEntity} from "./testing-utils";
//endregion


describe('@Entity', () => {
	
	beforeAll(async () => {
		
		await Entity.init(await TEST_INIT_OPTS())
	})
	
	beforeEach(async () => {
		await Entity.db.delete_db()
		await resetEntity();
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
			person      = await atomic(() => new Person()),
			collections = await Entity.db.list_collections(),
			collection  = Entity.db.db.collection(Person.collection_name),
			instances   = await collection.find({}).toArray();
		
		expect(Person.instances[0] === person).toBeTruthy();
		expect(person._id).toBeTruthy();
		expect(typeof person._id === 'string').toBeTruthy();
		expect(collections).toEqual(['Person'])
		expect(instances.length).toEqual(1);
		expect((<Person>instances[0])._id).toBeTruthy();
		expect(instances)
			.toEqual([{
				_id          : person._id,
				'__parents__': []
			}])
	})
	
	test('Delete an entity', async () => {
		@Entity()
		class Person extends Model {
			@field name: string;
			@field age: number;
		}
		
		const
			person     = await atomic(() => new Person({
				name: 'person',
				age : 30
			})),
			collection = Entity.db.db.collection(Person.collection_name);
		
		await person.delete()
		const instances = await collection.find({}).toArray();
		
		await Entity.reset()
		await Entity.init(await TEST_INIT_OPTS())
		
		const Class = await atomic(() => {
			@Entity()
			class Person extends Model {
				@field name: string;
				@field age: number;
			}
			
			return Person
		})
		
		expect(instances.length).toEqual(0)
		expect(Entity.Classes[0] === Class).toBeTruthy()
		expect(Class.instances.length).toEqual(0)
	})
	
	
	test('Entity.init() should load entities', async () => {
		@Entity()
		class Person extends Model<Person> {
			@field name: string;
		}
		
		const
			name       = 'person',
			person     = await atomic(() => new Person({name})),
			_id        = person._id,
			collection = Entity.db.db.collection(Person.collection_name);
		
		await Entity.reset()
		expect(Person.instances.length).toEqual(0)
		
		await Entity.init(await TEST_INIT_OPTS())
		
		const new_Class: Class = await atomic<Promise<Class>>(async () => {
			@Entity()
			class Person extends Model<Person> {
				@field name: string;
			}
			return Person
		})
		
		const instances = await collection.find({}).toArray();
		
		expect(instances.length).toEqual(1)
		expect(instances[0])
			.toEqual({
				_id,
				name,
				'__parents__': []
			})
		expect(new_Class.instances.length)
			.toEqual(1)
		
		expect(new_Class.instances[0] instanceof new_Class).toBeTruthy()
		
		expect(new_Class.instances[0])
			.toEqual(expect.objectContaining({_id}))
	})
})
