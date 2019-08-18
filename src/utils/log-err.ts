import {Log} from './Log';

export const logErr = (err:Error) => {
	Log(err);
	return Promise.reject(err);
};
