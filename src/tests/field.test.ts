//region imports
import {MongoMemoryServer}    from 'mongodb-memory-server';
import {Entity, field, Model} from "..";
import {MONGO_CONFIG}         from "../CONFIG";
import {atomic}               from "../functions/atomic";
import {Class}                from "../model/types/class";
import {resetEntity}          from "./testing-utils";
import {FIELDS, PARENTS}      from "../model/helpers/model-helpers";

declare let global;
//endregion


const mongoServer = new MongoMemoryServer();

describe('@field', () => {
		let url, port, db_path, db_name;
		
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
			// Model.prototype.toJSON = undefined
		})
		
		beforeEach(async () => {
			await Entity.clear_db()
		});
		
		afterEach(async () => {
		});
		
		afterAll(async () => {
			await mongoServer.stop()
		})
		
		test('Set a field in the constructor', async () => {
			@Entity()
			class Person extends Model<Person> {
				@field color: 'red' | 'green' | 'blue'
			}
			
			const
				person     = new Person({color: 'green'}),
				collection = Entity.db_connector.db.collection(Person.collection_name),
				instances  = await collection.find({}).toArray();
			
			expect(instances)
				.toEqual([{
					'_id'        : person._id,
					'__parents__': [],
					'color'      : 'green'
				}])
			
			await atomic(() => {
				person.color = "blue"
			})
			
			const instances2 = await collection.find({}).toArray();
			expect(instances2)
				.toEqual([{
					'_id'        : person._id,
					'__parents__': [],
					'color'      : 'blue'
				}])
		})
		
		test('set and unset a @field', async () => {
			@Entity()
			class Person extends Model<Person> {
				@field color: 'red' | 'green' | 'blue'
			}
			
			const
				person     = await atomic<Person>(() => {
					return new Person({color: 'green'});
				}),
				collection = Entity.db_connector.db.collection(Person.collection_name),
				instances  = await collection.find({}).toArray();
			
			
			expect(instances[0]).toEqual({
				_id          : person._id,
				'__parents__': [],
				color        : 'green'
			})
			
			
			await atomic(() => {
				delete person.color;
			})
			
			const instances2 = await collection.find({}).toArray();
			
			expect(instances2[0]).toEqual({
				_id          : person._id,
				'__parents__': []
			})
		})
		
		test('set an object @field and load', async () => {
			@Entity()
			class Person extends Model<Person> {
				@field address: { street: { name4: string, number: number }, building: { color: string, floors: number[] }, city: string }
			}
			
			const address = {
				city    : 'Washington, DC',
				building: {
					color : 'white',
					floors: [1, 2, 3, 4]
				},
				street  : {
					name4 : 'Pennsylvania',
					number: 1600,
				}
			};
			
			const [person] = await atomic(() => {
				const person = new Person(<Partial<Person>>{
					address: {
						city    : 'Washington, DC',
						building: {
							color : 'white',
							floors: [1, 2, 3, 4]
						},
						street  : {
							name4 : 'Pennsylvania',
							number: 1600,
						}
					}
				})
				return [person, Person]
			});
			
			const
				collection = Entity.db_connector.db.collection(Person.collection_name),
				instances  = await collection.find({}).toArray();
			
			expect(instances[0]).toEqual(expect.objectContaining(<Partial<Person>>{
				_id          : person._id,
				'__parents__': [],
				address      : {
					city    : 'Washington, DC',
					building: {
						color : 'white',
						floors: [1, 2, 3, 4]
					},
					street  : {
						name4 : 'Pennsylvania',
						number: 1600,
					}
				}
			}))
			
			await atomic(() => {
				person.address.building.floors.push(5)
			})
			
			await resetEntity();
			
			let Class2: Class = await atomic<Class>(() => {
				@Entity()
				class Person extends Model<Person> {
					@field address
				}
				
				return Person
			})
			
			let person2 = <Person>Class2.instances[0];
			
			expect(person2.address.building.floors)
				.toEqual([1, 2, 3, 4, 5])
			
		})
		
		test('delete a @field', async () => {
			@Entity()
			class Person extends Model<Person> {
				@field address: { street: string }
			}
			
			const person = await atomic<Person>(() => {
				return new Person({address: {street: 'Byron'}});
			})
			
			
			await atomic(() => {
				person.address = undefined
			})
			
			await resetEntity();
			
			const Class2  = await atomic<Class>(() => {
				      @Entity()
				      class Person extends Model<Person> {
					      @field address
				      }
				
				      return Person
			      }),
			
			      person2 = <Person>Class2.instances[0];
			
			expect(person2)
				.toEqual(expect.objectContaining({
					_id      : person2._id,
					[PARENTS]: [],
					[FIELDS] : {},
				}))
		})
	}
)
