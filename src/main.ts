//region imports
import {processMgmt} from "./utils/process-mgmt";
import {MONGO_CONFIG} from "./CONFIG";
import {Reactive} from "./decorators/reactive/reactive-decorator";
import {Model} from "./model/Model";
import {field} from "./decorators/field/field-decorator";
import {hasMany} from "./decorators/has-many/has-many-decorator";

//endregion


(async () => {
	processMgmt();
	await Reactive.init({db_config: {username: MONGO_CONFIG.user, pwd: MONGO_CONFIG.pwd}});

	await Reactive.clear_db()

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

	@Reactive()
	class Cat extends Model<Cat> {
		@field name
	}

	@Reactive()
	class Person2 extends Model<Person2> {
		@field name
		@hasMany cats: Cat[]
	}

	const
		cat1   = new Cat({name: 'Mitzy'}),
		cat2   = new Cat({name: 'Mourice'}),
		cat3   = new Cat({name: 'Phillipe'}),
		person = new Person2({name: 'person', cats: [cat1, cat2, cat3]});


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

	Reactive.db.close()

})()

