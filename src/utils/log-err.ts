import {Log} from './Log';

export const logErr = (err) => {
	Log(err);
	return Promise.reject(err);
};
