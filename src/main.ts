//region imports
import {processMgmt}  from "./utils/process-mgmt";
import {MONGO_CONFIG} from "./CONFIG";
import {Entity}       from "./entity";
import {Model}        from "./abstract/model";
import {field}        from "./decorators/field-decorator";
import {hasOne}       from "./decorators/has-one-decorator";

//endregion

/*
@Entity()
export class Dog extends Model<Person> {
    @field age: number;
    @field name: string;
}
*/

/*
@Entity()
export class Cat extends Model<Person> {
    @field color: string;
    @field name: string;
}
*/

@Entity()
export class Person extends Model<Person>
{
	@field age: number = 39
	@field name: string;
	@field brothers: string[] = ['John', 'Benny'];
	
	//    @hasOne dog: Dog;
	
	// @hasMany cats: Cat[]
}

(async () => {
	processMgmt();
	await Entity.init({db_config: {username: MONGO_CONFIG.user, pwd: MONGO_CONFIG.pwd}});
	
	await Entity.clear_db()
	
	// let cat = new Cat()
	// cat.color = 'black';
	// let cat2 = new Cat()
	// cat2.color = 'black';
	
	//    let dog = new Dog()
	//    dog.name = "Yoyo"
	//    dog.age = 11
	
//	let person = new Person();
//	person.age = 322;
//	person.name = 'Rotem'
	
	//    person.dog = dog
	
	// person.cats.push(cat, cat2)
	// await Person.load()
	// console.log((jsonify((<Person>Person.instances[0]).data)));
	
	// let person2 = <Person>Person.instances[0];
	// person2.set({
	//     name: 'new name',
	//     age : 23
	// })
	
	// person2.delete();
	
	Entity.db.close()
	
})()

