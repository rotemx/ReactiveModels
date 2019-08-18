import {decycle} from "json-cyclic"

export const jsonify = (json:object, accuracy = 8) => JSON.stringify(decycle(json), function (key, val) {
	return val && val.toFixed ? Number(val.toFixed(accuracy)) : val
}, 2)

export const json = data => data ? JSON.stringify(decycle(data)) : data
