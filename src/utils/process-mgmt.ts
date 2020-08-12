import {Entity} from "..";

function onExit(err) {
	// console.log('[XXX] Entity Framework Exit', arguments);
	
	if (err) {
		console.error(err, 'NODE ERROR >>> ', 'ERRORS');
	} else {
		// console.log('Node process - no error.', 'runner');
	}

	// process.exit();
}

export const processMgmt = () => {
	const proc: any = process;
	proc.on('uncaughtException', onExit);
	proc.on('exit', onExit);
	proc.on('SIGINT', onExit);
	// process.on('unhandledRejection', r => {
	//     Log(r, 'unhandled promise ', 'ERROR');
	// });

}
