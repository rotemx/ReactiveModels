//region imports
import {Entity} from "../decorators/entity/entity-decorator";
import {Mongo} from "../db/__mock__/mongo";
import {field} from "../decorators/field/field-decorator";
import {Model} from "../abstract/Model";
import {hasOne} from "../decorators/has-one/has-one-decorator";
import {hasMany} from "../decorators/has-many/has-many-decorator";
import {IHasManyConfig} from "../types/interfaces/i-has-many-config";
import Mock = jest.Mock;

//endregion

@Entity()
export class Person extends Model<Person> {
	@field name: string
	@field age: number
}

describe('Relations', () => {
	const mongo = new Mongo();

	beforeEach(async () => {
		await Entity.init({db_config: {username: 'blah', pwd: 'Blah', mongo_instance: mongo}})
	});

	test('hasOne sanity with same-class child', () => {
		@Entity()
		class Person extends Model<Person> {
			@field name
			@hasOne brother: Person
		}

		const
			key     = 'brother',
			person1 = new Person({name: 'person1'}),
			person2 = new Person({name: 'person2', [key]: person1})

		expect(person2._hasOnes[key] === person1._id)
		expect(person1._parents[0].key === key)
		expect(person1._parents[0]._id === person1._id)
		expect(person1._parents[0].collection_name === Person.collection_name)

		expect(person2.brother._id === person1._id)

		const upsert_calls = (<Mock>mongo.upsert).mock.calls;
		expect(upsert_calls.length).toEqual(2)
		expect(upsert_calls.find(params => params[0]._id === person2._id)[1]._hasOnes[key] === person1._id).toBeTruthy()
		expect(upsert_calls.find(params => params[0]._id === person1._id)[1]).toBeTruthy()
	})

	test('hasOne sanity with different-class child', () => {

		@Entity()
		class Dog extends Model<Dog> {
			@field name : string
		}

		@Entity()
		class Person extends Model<Person> {
			@field name : string
			@hasOne dog: Dog
		}

		const
			name   = 'John',
			key    = 'dog',
			dog    = new Dog({name: 'Ralf',}),
			person = new Person({name, dog});

		expect(person._hasOnes[key] === dog._id)
		expect(Person.hasOnes[0].Class).toBe(Dog);
		expect(Person.hasOnes[0].key).toBe(key);


		expect(dog._parents[0].key === key)
		expect(dog._parents[0]._id === person._id)
		expect(dog._parents[0].collection_name === Person.collection_name)

		expect(person.dog._id === dog._id)

		const upsert_calls = (<Mock>mongo.upsert).mock.calls;
		expect(upsert_calls.length).toEqual(3)
		expect(upsert_calls.find(params => params[0]._id === person._id)[1].name).toEqual(name)
		expect(upsert_calls.find(params => params[0]._id === person._id)[1]._hasOnes[key] === dog._id).toBeTruthy()
		expect(upsert_calls.find(params => params[0]._id === dog._id)[1]).toBeTruthy()
	})


	test('hasMany sanity', () => {
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
			name   = 'John',
			key    = 'cats',
			cat1   = new Cat({name: 'Fluffy'}),
			cat2   = new Cat({name: 'Skinny'}),
			person = new Person({name});

		person.cats = [cat1]
		person.cats.push(cat2)

		expect(person._hasMany[key]).toEqual([cat1._id, cat2._id])
		// expect(Person.hasManys[0].Class).toBe(Cat); //not working - TS
		expect(Person.hasManys[0].key).toBe(key);


		expect(cat1._parents[0]).toEqual({
			_id:person._id,
			key,
			collection_name:Person.collection_name
		})
		expect(cat2._parents[0]).toEqual({
			_id:person._id,
			key,
			collection_name:Person.collection_name
		})


		expect(person.cats[0]._id === cat1._id)
		expect(person.cats[1]._id === cat2._id)

		const upsert_calls = (<Mock>mongo.upsert).mock.calls;
		expect(upsert_calls.length).toEqual(7)
		expect(upsert_calls.find(params => params[0]._id === person._id)[1].name).toEqual(name)
		expect(upsert_calls.filter(arr=>arr.find(param=>param===Person.name)).find(arr=>arr[1] && arr[1]._hasMany && arr[1]._hasMany[key] && arr[1]._hasMany[key].length===2)).toBeTruthy()

		expect(upsert_calls.find(params => params[0]._id === cat1._id)[1]).toBeTruthy()
		expect(upsert_calls.find(params => params[0]._id === cat2._id)[1]).toBeTruthy()
	})


});
