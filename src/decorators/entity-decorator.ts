//region imports
import "reflect-metadata";
import {IEntityInitOptions} from "../types/interfaces/entity-init-options";
import {Mongo} from "../db/mongo";
import {IdbConnector} from "../types/interfaces/idb-connector";
import {EntityBase} from "../abstract/entity-base";
import {field} from "./field-decorator";
import {processMgmt} from "../utils/process-mgmt";
import {MONGO_CONFIG} from "../CONFIG";

//endregion


export function Entity<T extends { new(...args: any[]) }>({collection_name}: EntityDecoratorOptions = {}) {
    return (Class) => {
        // Class.collection_name = collection_name || (Class.name) + 's';
        Class.collection_name = collection_name || (Class.name) + 's';
        Entity.classes[Class.collection_name] = Class;

        Class.db = Entity.db;
        Entity.classes[Class.collection_name] = {Class, instances: []};
        // Class.prototype.constructor.collection_name = collection_name;
        return Class
    }
}

export namespace Entity {
    export let db: IdbConnector;

    export const
        classes: { [collection_name: string]: { Class: any, instances: any[] } } = {},
        init: (db: IEntityInitOptions) => Promise<any> = async ({db_config}: IEntityInitOptions): Promise<any> => {
            const insta = db_config.mongo_instance || new Mongo();
            Entity.db = insta;
            await insta.init(db_config)
        },

        loadAll: () => Promise<void> = async () => {
            for (const [collection_name, {Class, instances}] of Object.entries(classes)) {
                instances.push([...(await Class.load())])
            }
        }


}



@Entity()
export class Person extends EntityBase<Person> {
    @field age: number = 43
    @field name: string = 'rotem'
}
@Entity()
export class Dog extends EntityBase<Person> {
    @field age: number;
    @field name: string;
}


(async () => {
    processMgmt();
    await Entity.init({db_config: {username: MONGO_CONFIG.user, pwd: MONGO_CONFIG.pwd}});


    await Entity.loadAll()

/*
    let person = new Person();
    person.age = 32;

    let dog = new Dog()
    dog.age  =13;
    dog.name = "Sparky"

*/

    // await Person.load()
    // console.log((jsonify((<Person>Person.instances[0]).data)));

    // let person2 = <Person>Person.instances[0];
    // person2.set({
    //     name: 'new name',
    //     age : 23
    // })

    // person2.delete();

    Entity.db.close()
})()



