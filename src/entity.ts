//region imports
import "reflect-metadata";
import {IEntityInitOptions} from "./types/interfaces/entity-init-options";
import {Mongo} from "./db/mongo";
import {IdbConnector} from "./types/interfaces/idb-connector";
import {Model} from "./abstract/model";
import {field} from "./decorators/field-decorator";
import {processMgmt} from "./utils/process-mgmt";
import {MONGO_CONFIG} from "./CONFIG";
import {hasOne} from "./decorators/has-one-decorator";
import {hasMany} from "./decorators/has-many-decorator";

//endregion

export type UserClass = typeof Model;

export function Entity<T extends { new(...args: any[]) }>({collection_name}: EntityDecoratorOptions = {}) {
    return (Class) => {
        Class.collection_name = collection_name || (Class.name) + 's';
        Entity.user_classes[Class.collection_name] = Class;
        return Class
    }
}

export namespace Entity {
    export let db: IdbConnector;

    export const
        user_classes: UserClass[] = [],
        init: (db: IEntityInitOptions) => Promise<any> = async ({db_config, load_all = true}: IEntityInitOptions): Promise<any> => {
            const db_instance = db_config.mongo_instance || new Mongo();
            Entity.db = db_instance;
            await db_instance.init(db_config)
            if (load_all) {
                await Entity.loadAll()
            }
        },

        loadAll: () => Promise<void> = async () => {
            Entity.user_classes.forEach(userClass => userClass.load())
        },

        clear_db: () => Promise<void> = async () => {
            await Entity.db.delete_db()
        }


}


@Entity()
export class Dog extends Model<Person> {
    @field age: number;
    @field name: string;
}

@Entity()
export class Cat extends Model<Person> {
    @field color: string;
    @field name: string;
}

@Entity()
export class Person extends Model<Person> {
    // @field age: number = 43
    @field name: string;
    @field colors: any;

    @hasOne dogs: Dog;

    @hasMany cats: Cat[]
}


(async () => {
    processMgmt();
    await Entity.init({db_config: {username: MONGO_CONFIG.user, pwd: MONGO_CONFIG.pwd}, load_all: true});


    await Entity.clear_db()
    // await Entity.loadAll()

    /*
        let cat = new Cat()
        cat.color = 'gray';
        cat.name = "Mitzi"
    */

    let person = new Person();
    // person.age = 322;

    /*
    let dog = new Dog()

    dog.age = 13;
    dog.name = "Sparky"
    person.dog = dog;
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



