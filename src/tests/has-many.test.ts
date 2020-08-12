//region imports
import {MongoMemoryServer}             from 'mongodb-memory-server';
import {Entity, field, hasMany, Model} from "..";
import {MONGO_CONFIG}                  from "../../CONFIG";
import {atomic}                        from "../functions/atomic";
import {resetEntity}                   from "./testing-utils";
import {Class}                         from "../model/types/class";



declare class Cat extends Model<Cat> {
	name: string
	color: 'white' | 'brown' | 'black' | 'redhead'
}

declare class Person extends Model<Person> {
	name: string
	cats: Cat[]
}

//endregion


const hasManyBase = async () => {
	@Entity()
	class Cat extends Model<Cat> {
		@field color: 'white' | 'brown' | 'black' | 'redhead'
		@field name: string
	}
	
	@Entity()
	class Person extends Model<Person> {
		@hasMany cats: Cat[]
		@field name: string
	}
	
	const
		cat1   = new Cat({color: 'redhead', name: 'Garfield'}),
		cat2   = new Cat({color: 'black', name: 'Maverick'}),
		cats   = [cat1, cat2],
		person = new Person({
			name: 'John Arbuckle',
			cats: cats
		});
	
	
	return [Person, Cat, cat1, cat2, cats, person] as
		[typeof Person, typeof Cat, Cat, Cat, Cat[], Person]
}

const mongoServer = new MongoMemoryServer();

describe('@hasMany', () => {
		//region prep
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
			await Entity.db.delete_db()
			await resetEntity();
		});
		
		afterEach(async () => {
		});
		
		afterAll(async () => {
			await mongoServer.stop()
		})
		//endregion
		
		test('Set a @hasMany relation and check memory+db', async () => {
			
			const
				[Person, Cat, cat1, cat2, cats, person] = await hasManyBase(),
				persons_collection                      = Entity.db.db.collection(Person.collection_name),
				cats_collection                         = Entity.db.db.collection(Cat.collection_name),
				person_data                             = await persons_collection.find({}).toArray(),
				cats_data                               = await cats_collection.find({}).toArray();
			
			
			expect(person.cats).toEqual(cats)
			expect(person_data).toEqual([{
				"__parents__": [],
				name         : person.name,
				_id          : person._id,
				cats         : cats.map(cat => cat._id)
			}])
			
			expect(cats_data).toEqual([
				{
					__parents__: [
						{
							_id            : person._id,
							collection_name: "Person",
							key            : "cats"
						}
					],
					_id        : cat1._id,
					color      : "redhead",
					name       : "Garfield"
				},
				{
					__parents__: [
						{
							_id            : person._id,
							collection_name: "Person",
							key            : "cats"
						}
					],
					_id        : cat2._id,
					color      : "black",
					name       : "Maverick"
				}
			])
			
			expect(cat1.getParentModels()).toEqual([person])
			expect(cat2.getParentModels()).toEqual([person])
		})
		
		test('@hasMany check after reload', async () => {
				const
					[Person, Cat, cat1, cat2, cats, person] = await hasManyBase();
				
				await resetEntity();
				
				const [PersonReloaded, CatReloaded] = await atomic<[Class, Class]>(() => {
					      @Entity()
					      class Cat extends Model<Cat> {
						      @field color: 'white' | 'brown' | 'black' | 'redhead'
						      @field name: string
					      }
					
					      @Entity()
					      class Person extends Model<Person> {
						      @hasMany cats: Cat[]
						      @field name: string
					      }
					
					      return [Person, Cat]
				      }),
				
				      person_reloaded               = <Person>PersonReloaded.instances[0],
				      cat1_reloaded                 = (<Cat[]>CatReloaded.instances).find(cat => cat.name === cat1.name),  //order of instances is not guaranteed to persist (maybe it should?)
				      cat2_reloaded                 = (<Cat[]>CatReloaded.instances).find(cat => cat.name === cat2.name);
				
				expect(person_reloaded
					.cats.map(cat => cat.data))
					.toEqual(cats.map(cat => cat.data))
				
				expect(person_reloaded.data)
					.toEqual({
						name: person.name,
						cats: cats.map(c => c.data),
						_id : person._id,
					})
				
				expect(person_reloaded.name).toEqual(person.name)
				expect(person_reloaded.cats.length).toEqual(2)
				expect(person_reloaded.cats.every(m => m instanceof CatReloaded)).toBeTruthy()
				
				
				expect(person_reloaded.cats[0].getParentModels()).toEqual([person_reloaded])
				expect(person_reloaded.cats[1].getParentModels()).toEqual([person_reloaded])
				
				
				expect(cat1_reloaded.data)
					.toEqual({
						name : cat1.name,
						color: cat1.color,
						_id  : cat1._id,
					})
				expect(cat2_reloaded.data)
					.toEqual({
						name : cat2.name,
						color: cat2.color,
						_id  : cat2._id,
					})
				
			}
		)
		
		test('@hasMany remove relation', async () => {
			const [Person, Cat, cat1, cat2, cats, person] = await hasManyBase();
			
			function checkRam(_cats, parent) {
				expect(person.cats).toEqual(_cats)
				expect(cat1.getParentModels()).toEqual(parent)
				expect(cat2.getParentModels()).toEqual(parent)
			}
			
			person.cats = null;
			checkRam([], [])
			person.cats = cats;
			
			expect(person.cats).toEqual(cats)
			expect(cat1.getParentModels()).toEqual([person])
			expect(cat2.getParentModels()).toEqual([person])
			
			checkRam(cats, [person])
			
		})
		
	}
)
