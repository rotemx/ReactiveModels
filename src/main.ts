//region imports
import {processMgmt} from "./utils/process-mgmt";
import {MONGO_CONFIG} from "./CONFIG";
import {Entity} from "./entity";
import {Model} from "./abstract/Model";
import {field} from "./decorators/field-decorator";
import {hasOne} from "./decorators/has-one-decorator";
import {hasMany} from "./decorators/has-many-decorator";
import {json} from "./utils/jsonify";

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
			brothers: [meishar, moti]  //todo: fix hasOne / _hasMany in ctor data assign
		});

	console.log(json(rotem.data));
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

