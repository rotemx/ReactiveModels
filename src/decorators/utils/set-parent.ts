import {Model} from "../../abstract/Model";

export function setParent<T extends Model<T>>(this: Model<any>, child: Model<T>, key: string): void {
	let idx = child._parents.findIndex(p => p._id === this._id);
	if (idx > -1) {
		console.warn(`EntityFramework: setParent: Found old ${key} parent _id ${this._id} in child ${child._id} of class ${child.Class.name}. Weird. `);
		child._parents.splice(idx, 1)
	}

	child._parents.push({
		_id            : this._id,
		key,
		collection_name: this.Class.collection_name
	})

}
