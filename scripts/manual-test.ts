import {Entity, field, Model} from "../src";
import {MONGO_CONFIG}         from "../CONFIG";
import {atomic}               from "../src/functions/atomic";
import {resetEntity}          from "../src/tests/testing-utils";
import {Class}                from "../src/model/types/class";

const isEqual = require('lodash/isEqual');

(async () => {
	await Entity.init({db_config: {username: MONGO_CONFIG.user, pwd: MONGO_CONFIG.pwd}});
	// await Entity.clearDb()
	
	@Entity()
	class Person extends Model<Person> {
		@field address: { street: string, rooms: number[] }
	}
	
	const person = await atomic<Person>(() => {
		return new Person({
			address: {
				street: 'Byron',
				rooms : [1, 2, 3, 4]
			}
		});
	})
	
	await atomic(() => {
		person.address.rooms.push(5)
		person.address.rooms.shift()
		person.address.rooms.unshift(-1)
		person.address.rooms.splice(2, 1)
	})
	
	await resetEntity();
	
	const Class2  = await atomic<Class>(() => {
		      @Entity()
		      class Person extends Model<Person> {
			      @field address
		      }
		
		      return Person
	      }),
	      person2 = <Person>Class2.instances[0];
	
	if (isEqual(person2.data, {
			_id    : person2._id,
			address: {
				street: 'Byron',
				rooms : [-1, 2, 4, 5]
			}
		}
	)) {
		console.log('OK');
	}
	else {
		console.log('ERROR');
	}
	
})()
