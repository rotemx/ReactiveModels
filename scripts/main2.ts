import {Entity, field, Model} from "./../src";
import {MONGO_CONFIG}         from "../CONFIG";



(async () => {
	
	await Entity.init({db_config: {username: MONGO_CONFIG.user, pwd: MONGO_CONFIG.pwd}});
	
	@Entity()
	class Session extends Model<Session> {
		@field id;
		@field state = {id: {name:'d'}}
	}
	
	let session = new Session()
	
	session.id = "Flurry"
	
	
	
})()
