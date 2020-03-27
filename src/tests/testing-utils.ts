//region imports
import {MongoMemoryServer}  from "mongodb-memory-server-core";
import {MONGO_CONFIG}       from "../../CONFIG";
import {IEntityInitOptions} from "../decorators/entity/i-entity-init-options";
import {Entity}             from "..";
//endregion

export const mongoServer = new MongoMemoryServer();
let
	url,
	port,
	db_path;


export const TEST_INIT_OPTS = async (): Promise<IEntityInitOptions> => {
	url = url || await mongoServer.getConnectionString();
	port = port || await mongoServer.getPort();
	db_path = db_path || await mongoServer.getDbPath();
	
	return {
		db_config: {
			url,
			port,
			username: MONGO_CONFIG.user,
			pwd     : MONGO_CONFIG.pwd
		}
	}
}

export const resetEntity = async ():Promise<any> => {
	return Entity.reset().then(async () =>  await Entity.init(await TEST_INIT_OPTS()))
	
}
