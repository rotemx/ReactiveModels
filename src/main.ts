//region imports
import {processMgmt} from "./utils/process-mgmt";
import {MONGO_CONFIG} from "./CONFIG";
import {Entity} from "./decorators/entity/entity-decorator";
import {Model} from "./model/Model";
import {field} from "./decorators/field/field-decorator";
import {hasOne} from "./decorators/has-one/has-one-decorator";
import {hasMany} from "./decorators/has-many/has-many-decorator";

//endregion

@Entity()
export class Dog extends Model<Dog> {
	@field age: number;
	@field color: string;
}

@Entity()
export class Cat extends Model<Cat> {
	@field color: string;
	@field name: string;
}

@Entity()
export class Person extends Model<Person> {
	@field age: number;
	@field name: string;
	@hasMany brothers: Person[]

	@hasOne cat: Cat
	@hasOne dog: Dog

}

(async () => {
	processMgmt();
	await Entity.init({db_config: {username: MONGO_CONFIG.user, pwd: MONGO_CONFIG.pwd}});

	await Entity.clear_db()

	/*
	 let cat = new Cat({
	 color: 'red'
	 })


	 let dog = new Dog({
	 color: 'White',
	 age  : 11
	 })

	 const
	 meishar = new Person({name: 'Meishar'}),
	 moti    = new Person({name: 'Moti'}),
	 rotem   = new Person({
	 name    : 'Rotem',
	 age     : 39,
	 cat,
	 dog,
	 brothers: [meishar, moti]  //todo: fix hasOne / _hasManys in ctor data assign
	 });
	 */

	@Entity()
	class Cat extends Model<Cat> {
		@field name
	}

	@Entity()
	class Person extends Model<Person> {
		@field name
		@hasMany cats: Cat[]
	}

	const
		cat1   = new Cat({name: 'Mitzy'}),
		cat2   = new Cat({name: 'Mourice'}),
		cat3   = new Cat({name: 'Phillipe'}),
		person = new Person({name: 'person', cats: [cat1, cat2, cat3]});


	// person.cats[2].name = "Boris"
	delete person.cats[2]
	//    rotem.dog = dog

	// rotem.cats.push(cat, cat2)
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

