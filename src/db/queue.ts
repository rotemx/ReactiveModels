
export class Queue {
	private static workingOnPromise: boolean = false;
	private static queue:{
		fn:Function,
		resolve:Function,
		reject:(reason?)=>void,
		params:any[]
	}[] = [];
	
	static enqueue<T>(fn: Function, params:any[] = []):Promise<T> {
		return new Promise<T>((resolve, reject) => {
			this.queue.push({
				fn,
				resolve,
				reject,
				params
			});
			this.dequeue<T>();
		});
	}
	
	private static dequeue<T>() {
		if (this.workingOnPromise) {
			return false;
		}
		if (!this.queue.length) {
			return false;
		}
		
		const item = this.queue.shift();
		try {
			this.workingOnPromise = true;
			item.fn(...item.params)
			    .then((value:T) => {
				    this.workingOnPromise = false;
				    item.resolve(value);
				    this.dequeue();
			    })
			    .catch(err => {
				    this.workingOnPromise = false;
				    item.reject(err);
				    this.dequeue();
			    })
		} catch (err) {
			this.workingOnPromise = false;
			item.reject(err);
			this.dequeue<T>();
		}
		return true;
	}
}
