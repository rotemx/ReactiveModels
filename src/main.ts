//region imports
import {processMgmt} from "./utils/process-mgmt";
import {MONGO_CONFIG} from "./CONFIG";
import {Model} from "./model/model";
import {field} from "./decorators/field/field-decorator";
import {Entity} from "./decorators/entity/entity-decorator";
import {hasMany} from "./decorators/has-many/has-many-decorator";

//endregion


(async () => {
	processMgmt();
	await Entity.init({db_config: {username: MONGO_CONFIG.user, pwd: MONGO_CONFIG.pwd}});

	await Entity.clear_db()

	@Entity()
	class Person extends Model<Person> {
		@field name;
		@field details;
		@hasMany brothers: Person[]
	}

	const
		brother1       = new Person({name: 'brother1'}),
		person_1        = new Person({name: 'person_1', brothers: [brother1]}),
		brother2 = new Person({name: 'brother2'});

	person_1.brothers.push(brother2)

	person_1.brothers = [brother1]


	/*		person_1 = new Person({
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
	 brother1:brother1
	 })*/

	// person_1.details.address.building.floors = 6;
	Entity.db.close()
})()
