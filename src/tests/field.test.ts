//region imports
import {MongoMemoryServer}    from 'mongodb-memory-server';
import {Entity, field, Model} from "..";
import {MONGO_CONFIG}         from "../CONFIG";
import {atomic}               from "../functions/atomic";
import {Class}                from "../model/types/class";
import {resetEntity}          from "./testing-utils";

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
			await Entity.clearDb()
			await resetEntity();
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
				@field address: { street: { name: string, number: number }, building: { color: string, floors: number[] }, city: string }
			}
			
			const person = await atomic<Person>(() =>
				new Person(<Partial<Person>>{
					address: {
						city    : 'Washington, DC',
						building: {
							color : 'white',
							floors: [1, 2, 3, 4]
						},
						street  : {
							name  : 'Pennsylvania',
							number: 1600,
						}
					}
				}));
			
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
						name  : 'Pennsylvania',
						number: 1600,
					}
				}
			}))
			
			await resetEntity();
			
			let Class2: Class = await atomic<Class>(() => {
				@Entity()
				class Person extends Model<Person> {
					@field address
				}
				
				return Person
			})
			
			let person2 = <Person>Class2.instances[0];
			
			expect(person2.data)
				.toEqual({
					_id    : person._id,
					address: {
						city    : 'Washington, DC',
						building: {
							color : 'white',
							floors: [1, 2, 3, 4]
						},
						street  : {
							name  : 'Pennsylvania',
							number: 1600,
						}
					}
					
				})
			
		})
		
		test('set a @field with undefined', async () => {
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
			
			expect(person2.data)
				.toEqual({
					_id: person2._id,
				})
			
			expect(person2.address).toBeFalsy()
		})
		
		test('mutate a @field array with splice, pop and push', async () => {
			@Entity()
			class Person extends Model<Person> {
				@field address: { street: string, rooms: number[] }
			}
			
			const person = await atomic<Person>(() => {
				return new Person({
					address: {
						street: 'Byron',
						rooms: [1, 2, 3, 4]
					}
				});
			})
			
			await atomic(() => {
				person.address.rooms.push(5)
				person.address.rooms.shift()
				person.address.rooms.unshift(-1)
				person.address.rooms.splice(2,1)
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
			
			expect(person2.data)
				.toEqual({
					_id    : person2._id,
					address: {
						street: 'Byron',
						rooms: [-1, 2, 4, 5]
					}
				})
		})
	}
)
