//region imports
import {field, Model, Reactive} from "..";
import {MONGO_CONFIG} from "../CONFIG";

//endregion


describe('Reactive decorator', () => {


	beforeEach(async ()=>{
		await Reactive.init({db_config: {username: MONGO_CONFIG.user, pwd: MONGO_CONFIG.pwd}});
		await Reactive.clear_db()
	})

	test('Reactive.init() should load all instances', async () => {

		@Reactive()
		class Person extends Model<Person> {
			@field name;
			@field age
		}

		@Reactive()
		class Cat extends Model<Cat> {
			@field name;
		}

		const
			person  = new Person(),
			person2 = new Person(),
			cat     = new Cat(),
			cat2    = new Cat();


		await Reactive.db.close();
		await Reactive.init({db_config: {username: MONGO_CONFIG.user, pwd: MONGO_CONFIG.pwd}});
		expect(Reactive.Classes.find(c => c.collection_name === Person.collection_name).instances.length).toEqual(2)
		expect(Reactive.Classes.find(c => c.collection_name === Cat.collection_name).instances.length).toEqual(2)
		await Reactive.db.close();

	})

});
