//region imports
import {Entity} from "../decorators/entity/entity-decorator";
import {Mongo} from "../db/__mock__/mongo";
import {field} from "../decorators/field/field-decorator";
import {Model} from "../abstract/Model";
import {Class} from "../types/types/class";
import Mock = jest.Mock;
//endregion


describe('Entity decorator', () => {
	const mongo = new Mongo();

	beforeAll(async () => {
	})

	beforeEach(async () => {
		await Entity.init({db_config: {username: 'blah', pwd: 'Blah', mongo_instance: mongo}})
	});

	afterEach(async () => {
		await Entity.db.close();
	});


	test('creating an entity', () => {
		@Entity()
		class Person extends Model<Person> {
			@field name
			@field age
		}

		let person = new Person();
		expect(mongo.upsert).toBeCalledTimes(1)
		expect(person._id).toBeTruthy();
		expect((<Mock>mongo.upsert).mock.calls[0][0]._id).toEqual(person._id)
	})

	test('deleting an entity', () => {
		@Entity()
		class Person extends Model<Person> {
			@field name
			@field age
		}

		let person = new Person();
		person.delete()
		expect(mongo.delete).toBeCalledTimes(1)
		expect((<Mock>mongo.delete).mock.calls[0][0]._id).toEqual(person._id)
	})

	test('setting a field directly', () => {
		@Entity()
		class Person extends Model<Person> {
			@field name
			@field age
		}

		const
			person = new Person(),
			name   = "Rotem";

		person.name = name
		expect(mongo.upsert).toBeCalledTimes(2)
		expect(person.name).toEqual(name);
		expect((<Mock>mongo.upsert).mock.calls[1][1].name).toEqual(name)
	})

	test('setting multiple fields with set() method', () => {
		@Entity()
		class Person extends Model<Person> {
			@field name
			@field age
		}

		const
			person = new Person(),
			name   = "Rotem",
			age    = 39;

		person.set({
			name,
			age
		})

		expect(mongo.upsert).toBeCalledTimes(2)
		expect(person.name).toEqual(name);
		expect((<Mock>mongo.upsert).mock.calls[1][1].name).toEqual(name)
		expect((<Mock>mongo.upsert).mock.calls[1][1].age).toEqual(age)
	})

});
