//region imports
import {field, Model, Entity} from "..";
import {MONGO_CONFIG} from "../CONFIG";

//endregion


describe('Entity decorator', () => {


	beforeEach(async ()=>{
		await Entity.init({db_config: {username: MONGO_CONFIG.user, pwd: MONGO_CONFIG.pwd}});
		await Entity.clear_db()
	})

	test('Entity.init() should load all instances', async () => {

		@Entity()
		class Person extends Model {
			@field name;
			@field age
		}

		@Entity()
		class Cat extends Model {
			@field name;
		}

		const
			person  = new Person(),
			person2 = new Person(),
			cat     = new Cat(),
			cat2    = new Cat();


		await Entity.db.close();
		await Entity.init({db_config: {username: MONGO_CONFIG.user, pwd: MONGO_CONFIG.pwd}});
		expect(Entity.Classes.find(c => c.collection_name === Person.collection_name).instances.length).toEqual(2)
		expect(Entity.Classes.find(c => c.collection_name === Cat.collection_name).instances.length).toEqual(2)
		await Entity.db.close();

	})

});
