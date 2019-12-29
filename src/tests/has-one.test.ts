//region imports
import {MongoMemoryServer}            from 'mongodb-memory-server';
import {Entity, field, hasOne, Model} from "..";
import {MONGO_CONFIG}                 from "../CONFIG";
import {atomic}                       from "../functions/atomic";
import {resetEntity}                  from "./testing-utils";
import {Class}                        from "../model/types/class";

declare let global;
const mongoServer = new MongoMemoryServer();

//endregion

declare class Cat extends Model<Cat> {
	color: 'white' | 'brown' | 'black' | 'redhead'
}

declare class Person extends Model<Person> {
	cat: Cat
	name: string
}


describe('@hasOne', () => {
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
		
		test('Set a hasOne relation', async () => {
			const [Person, Cat] = await atomic(() => {
					@Entity()
					class Cat extends Model<Cat> {
						@field color: 'white' | 'brown' | 'black' | 'redhead'
					}
					
					@Entity()
					class Person extends Model<Person> {
						@hasOne cat: Cat
						@field name: string
					}
					
					return [Person, Cat]
				}
			)
			const
				color              = 'redhead',
				name               = 'John Arbuckle',
				cat                = new Cat({color}),
				person             = new Person({
					cat,
					name
				}),
				persons_collection = Entity.db_connector.db.collection(Person.collection_name),
				cats_collection    = Entity.db_connector.db.collection(Cat.collection_name),
				person_data        = await persons_collection.find({}).toArray(),
				cats_data          = await cats_collection.find({}).toArray();
			
			expect(person_data)
				.toEqual([{
					'_id'        : person._id,
					'__parents__': [],
					name,
					cat          : cat._id
				}])
			
			expect(cats_data)
				.toEqual([{
					'_id'        : cat._id,
					'__parents__': [{
						"_id"            : person._id,
						"collection_name": "Person",
						"key"            : "cat"
					}
					],
					color
				}])
			
			await resetEntity();
			const [Person2, Cat2] = await atomic<[Class, Class]>(() => {
				
				      @Entity()
				      class Cat extends Model<Cat> {
					      @field color: 'white' | 'brown' | 'black' | 'redhead'
				      }
				
				      @Entity()
				      class Person extends Model<Person> {
					      @hasOne cat: Cat
					      @field name: string
				      }
				
				      return [Person, Cat]
			      }),
			      person2         = <Person>Person2.instances[0],
			      cat2            = <Person>Cat2.instances[0];
			
			expect(person2.data)
				.toEqual({
					name,
					cat: {
						_id: cat._id,
						color
					},
					_id: person._id,
				})
			
			expect(person2.name).toEqual(name)
			expect(person2.cat).toBeInstanceOf(Cat2)
			expect(person2.cat._id).toEqual(cat2._id)
			expect(person2.cat.color).toEqual(color)
			
			expect(cat2.data)
				.toEqual({
					color,
					_id: cat._id,
				})
			
			expect(cat2.getParentModels()).toEqual([
				person2
			])
		})
		
		test('Set a @hasOne to null', async () => {
			@Entity()
			class Cat extends Model<Cat> {
				@field color: 'white' | 'brown' | 'black' | 'redhead'
			}
			
			@Entity()
			class Person extends Model<Person> {
				@hasOne cat: Cat
				@field name: string
			}
			
			const
				color  = 'redhead',
				name   = 'John Arbuckle',
				cat    = new Cat({color}),
				person = new Person({
					cat,
					name
				});
			await atomic(() => person.cat = null)
			
			expect(person.cat).toBeNull()
			expect(cat.getParentModels()).toEqual([])
			
			await resetEntity();
			
			const [Person2, Cat2] = await atomic<[Class, Class]>(() => {
				      @Entity()
				      class Cat extends Model<Cat> {
					      @field color: 'white' | 'brown' | 'black' | 'redhead'
				      }
				
				      @Entity()
				      class Person extends Model<Person> {
					      @hasOne cat: Cat
					      @field name: string
				      }
				
				      return [Person, Cat]
			      }),
			      person2         = <Person>Person2.instances[0],
			      cat2            = <Person>Cat2.instances[0];
			
			expect(person2.cat).toBeNull()
			expect(cat2.getParentModels()).toEqual([])
			
		})
		
		
		test('Delete a @hasOne relation', async () => {
			@Entity()
			class Cat extends Model<Cat> {
				@field color: 'white' | 'brown' | 'black' | 'redhead'
			}
			
			@Entity()
			class Person extends Model<Person> {
				@hasOne cat: Cat
				@field name: string
			}
			
			const
				color  = 'redhead',
				name   = 'John Arbuckle',
				cat    = new Cat({color}),
				person = new Person({
					cat,
					name
				});
			await atomic(() => delete person.cat)
			
			expect(person.cat).toBeNull()
			expect(cat.getParentModels()).toEqual([])
			
			await resetEntity();
			
			const [Person2, Cat2] = await atomic<[Class, Class]>(() => {
				      @Entity()
				      class Cat extends Model<Cat> {
					      @field color: 'white' | 'brown' | 'black' | 'redhead'
				      }
				
				      @Entity()
				      class Person extends Model<Person> {
					      @hasOne cat: Cat
					      @field name: string
				      }
				
				      return [Person, Cat]
			      }),
			      person2         = <Person>Person2.instances[0],
			      cat2            = <Person>Cat2.instances[0];
			
			expect(person2.cat).toBeNull()
			expect(cat2.getParentModels()).toEqual([])
			
		})
		
	}
)
