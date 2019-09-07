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
	await Entity.clear_db()


	@Entity()
	class Cattttt extends Model {
		@field name;
	}

	@Entity()
	class Person extends Model {
		@field name: string;
		@field age;
		@field details: { more?: string, address: { street: { apps: any[], number: number, name: string } } };
		@hasOne brother: Person
		@hasMany cats: Cattttt[]
	}

	let rotemx = new Person({
		name   : "Rotem",
		details: {

			address: {
				street: {
					name  : "Byron",
					number: 5,
					apps  : [1, 3, 4, 5, 6, 7, 8, 9, 10]
				},
			}
		}
	})


	let meishar = new Person({name: "Meishar"})

	let
		mitzy = new Cattttt({name:"Mitzy"}),
		mitzy2 = new Cattttt({name:"Mitzy2"})
	// rotemx.brother = meishar;
	rotemx.cats = [mitzy]

	rotemx.cats.push(mitzy2)
	delete rotemx.cats[0]

	// rotemx.details.address.street.number = 6

	// rotemx.details.address.street.apps.push(20);
	// rotemx.details.more = "blah"
	// delete  rotemx.details.more;
	// console.log((<Person>Person.instances[0]).brother);


	/*


	 const
	 // rotemx = new Person({age:39});
	 cat = new Cattttt({name:"Flurry"}),
	 brother = new Person({name: 'brother'}),
	 rotemx       = new Person({name: 'rotemx', brother, cats:[cat]});


	 rotemx.details = {
	 hello : {
	 hello: 'world'
	 }
	 }

	 rotemx.details.hello.hello = ["class"]

	 rotemx.details.hello.hello.push('BLAH')
	 rotemx.details.hello.hello.pop()

	 rotemx.age = 34;
	 console.log(rotemx.data);
	 */
	await Entity.db.close()
})()
