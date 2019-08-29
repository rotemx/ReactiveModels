//region imports
import {processMgmt} from "./utils/process-mgmt";
import {MONGO_CONFIG} from "./CONFIG";
import {Reactive} from "./decorators/reactive/reactive-decorator";
import {Model} from "./model/model";
import {field} from "./decorators/field/field-decorator";
import {hasOne} from "./decorators/has-one/has-one-decorator";

//endregion


(async () => {
	processMgmt();
	await Reactive.init({db_config: {username: MONGO_CONFIG.user, pwd: MONGO_CONFIG.pwd}});

	await Reactive.clear_db()

	@Reactive()
	class Person extends Model<Person> {
		@field name;
		@field details;
		@hasOne brother: Person
	}

	const
		person0 = new Person({name: 'brother'}),
		person1 = new Person({name: 'person1', brother: person0});

	/*		person = new Person({
	 details:{
	 address: {
	 street  : "Byron",
	 number  : 5,
	 building:
	 {
	 floors    : 4,
	 apartments: [{owner:'Huhammad', num: 5}, 2, 3, 4, 5, 6]
	 }
	 }
	 },
	 brother:person0
	 })*/
	;

	// person.details.address.building.floors = 6;

	Reactive.db.close()

})()
