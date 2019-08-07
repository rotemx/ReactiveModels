//region imports
import {EntityBase} from "../abstract/entity-base";
import {Entity} from "./entity-decorator";
import {Mongo} from "../db/__mock__/mongo";
import {field} from "./field-decorator";
import Mock = jest.Mock;

//endregion

export class Person extends EntityBase<Person> {
    @field name
    @field age
}


describe('Entity decorator', () => {
    const mongo = new Mongo();

    beforeAll(async () => {
        await Entity.init({db_config: {username: 'blah', pwd: 'Blah', mongo_instance: mongo}},)
    })

    beforeEach(() => {
    });

    test.skip('creating an entity', () => {
        let person = new Person();
        expect(mongo.upsert).toBeCalledTimes(1)
        expect(person._id).toBeTruthy();
        expect((<Mock>mongo.upsert).mock.calls[0][0]._id).toEqual(person._id)
    })

    test('deleting an entity', () => {
        let person = new Person();
        person.delete()
        expect(mongo.delete).toBeCalledTimes(1)
        expect((<Mock>mongo.delete).mock.calls[0][0]._id).toEqual(person._id)
    })

    test('setting a field directly', () => {
        const
            person = new Person(),
            name = "Rotem";

        person.name = name
        expect(mongo.upsert).toBeCalledTimes(2)
        expect(person.name).toEqual(name);
        expect((<Mock>mongo.upsert).mock.calls[1][1].name).toEqual(name)
    })

    test('setting multiple fields with set() method', () => {
        const
            person = new Person(),
            name = "Rotem",
            age = 39;

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
