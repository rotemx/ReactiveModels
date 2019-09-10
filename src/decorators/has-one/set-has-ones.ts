//region imports
import {FIELDS, REACTIVE} from "../../model/helpers/model-helpers";
import {Class} from "../../model/types/class";
import {IFieldMap} from "../../model/types/i-field-map";
import {Model} from "../../model/model";
import {json} from "../../utils/jsonify";
import {Entity} from "../..";

//endregion


function setHasOne(Class: Class, key: string) {
	Object.defineProperty(Class.prototype, key, {
		enumerable: true,
		get       : function (this: Model): Model | null {
			const fieldMap: IFieldMap = this[FIELDS];
			if (fieldMap[key]) {
				return Entity.find(<string>fieldMap[key].value, this.Class.hasOnes[key].collection_name)
			}
			return null
		},
		set       : function (this: Model, model: Model | string) {
			const
				fields: IFieldMap = this[FIELDS],
				old_child: Model  = this[key];

			if (old_child && old_child instanceof Model) {
				old_child.removeParent(this, key)
			}

			if (!model) {
				return delete fields[key]
			}
			if (model instanceof Model) {
				if (!(model.Class && model.Class[REACTIVE])) {
					throw new Error(`Value ${json(model)} is not an instance of ${Class.name}. Did you forget to call the @Reactive() decorator on the model's class definition?`)
				}

				if (old_child && old_child._id === model._id) {
					return console.log(`It's the same child model with _id ${model._id} `);
				}

				fields[key] = {
					value : model._id,
					hasOne: true,
					proxy : null,
					mode  : "entity"
				};
				this.update(key)
				model.addParent(this, key)
			}
		}
	})
}

export function setHasOnes(this: void, Class: Class): void {
	for (const key in Class.hasOnes || {}) {
		setHasOne(Class, key)
	}
}
