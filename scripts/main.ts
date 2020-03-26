//region imports

//endregion
import {Entity, field, hasMany, hasOne, Model} from "../src";
import {processMgmt}                           from "../src/utils/process-mgmt";
import {MONGO_CONFIG}                          from "../CONFIG";
import {atomic}                                from "../src/functions/atomic";

declare class Cat extends Model<Cat> {
	name: string
}

declare class Person extends Model<Person> {
	@field name: string;
	@field age: number;
	@hasOne brother: Person
	@hasMany cats: Cat[]
}


(async () => {
	processMgmt();
	
	await Entity.init({db_config: {username: MONGO_CONFIG.user, pwd: MONGO_CONFIG.pwd}});
	await Entity.clearDb()
	
	
	let [Person1, Cat1] = await atomic<[typeof Person, typeof Cat]>(() => {
		@Entity()
		class Cat extends Model<Cat> {
			@field name;
		}
		
		@Entity()
		class Person extends Model<Person> {
			@field name: string;
			@field age: number;
			@hasOne brother: Person
			@hasMany cats: Cat[]
		}
		
		let
			cat1   = new Cat({name: 'Flurry'}),
			cat2   = new Cat({name: 'Fleebsy'}),
			person = new Person({
				name: "John",
				cats: [cat1, cat2]
			})
		return [Person, Cat]
	})
	await Entity.reset()
	await Entity.init({db_config: {username: MONGO_CONFIG.user, pwd: MONGO_CONFIG.pwd}});
	
	let [Person_R, Cat_R] = await atomic<[typeof Person, typeof Cat]>(() => {
		@Entity()
		class Cat extends Model<Cat> {
			@field name;
		}
		
		@Entity()
		class Person extends Model<Person> {
			@field name: string;
			@field age: number;
			@field cat: Cat;
			@hasOne brother: Person;
			@hasMany cats: Cat[]
		}
		
		return [Person, Cat]
	})
	
	const person2 = <Person>Person_R.instances[0];
	
	person2.cats.length = 1;
	
	await Entity.db_connector.close()
})()
