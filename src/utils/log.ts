import * as fse from 'fs-extra';

const moment = require('moment');

export function Log(msg: any, fn?: string, filePrefix:string = 'MAIN', saveToFile:boolean = true) {
	
	if (typeof msg !== 'string')
	{
		msg = JSON.stringify(msg, null, 2);
	}
	
	const
		now      = moment().format('DD-MM-YY HH:mm:ss:SSS'),
		today    = moment().format('DD-MM-YY'),
		entry    = `${now} \t${fn ? fn + ':' : ''}\t${msg}\n`,
		filename = `logs/${today}/${filePrefix}-${today}-BTC-Real-Trader.log`;
	//
	
	if (saveToFile)
	{
		fse.ensureDir(`logs/${today}`);
		fse.ensureFile(filename);
		fse.appendFile(filename, `${entry}`);
	}
	process.stdout.write(entry);
}
