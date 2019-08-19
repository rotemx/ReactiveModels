import {Log} from "./log";

function onExit(err) {
	console.log('[XXX] Reactive Framework Exit', arguments);
	if (err) {

		Log(err, 'NODE ERROR >>> ', 'ERRORS');
	} else {
		Log('Node process - no error.', 'runner');
	}

	process.exit();
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
