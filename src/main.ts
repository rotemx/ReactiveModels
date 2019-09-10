//region imports
import {processMgmt} from "./utils/process-mgmt";
import {MONGO_CONFIG} from "./CONFIG";
import {Model} from "./model/model";
import {field} from "./decorators/field/field-decorator";
import {Entity} from "./decorators/entity/entity-decorator";
import {hasMany} from "./decorators/has-many/has-many-decorator";
import {hasOne} from "./decorators/has-one/has-one-decorator";

//endregion


(async () => {
	processMgmt();

	await Entity.init({db_config: {username: MONGO_CONFIG.user, pwd: MONGO_CONFIG.pwd}});
	// await Entity.clear_db()


	@Entity()
	class Cattttt extends Model {
		@field name;
	}

	@Entity()
	class Person extends Model {
		@field name: string;
		@field age:number;
		@field details: { more?: string, address: { street: { apps: any[], number: number, name: string } } };
		@hasOne brother: Person
		@hasMany cats: Cattttt[]
	}

	// let tidhar = new Person({
	// 	name: "Tidhar",
	// 	details : {address: {street: {name: 'Ben Yuhuda', number: 3, apps: [2323, 34, 4,]}}}
	// })


	// tidhar.details.address.street.apps.push(2)
	// tidhar.details.address.street.apps.splice(2,3)


	await Entity.db_connector.close()
})()
