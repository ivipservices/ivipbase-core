// import { DataBase, DataBaseSettings, LocalStorage, PathInfo } from "../src/index";

// class myStorage extends LocalStorage {
// 	public cache: { [path: string]: any } = {};

// 	constructor(db: DataBase) {
// 		super();
// 		db.emit("ready");
// 	}

// 	async set(path: string, value: any, options?: any): Promise<{ cursor?: string | undefined }> {
// 		console.log(path, value, options);
// 		const cursor = (this.cache[path] = value);
// 		return { ...(cursor ? { cursor } : {}) };
// 	}

// 	async get(path: string, options?: any): Promise<{ value: any; context: any; cursor?: string }> {
// 		return { value: this.cache[path] ?? null, context: { more: false } };
// 	}
// }

// class myDataBase extends DataBase {
// 	constructor(dbname: string, options?: Partial<DataBaseSettings>) {
// 		super(dbname, options);
// 		this.storage = new myStorage(this);
// 	}
// }

// const db = new myDataBase("local", {});

// db.ready(() => {
// 	console.log("init", db.isReady);
// });

// db.ref("root")
// 	.child("name")
// 	.set("ismael")
// 	.then(() => {
// 		return db.ref("root/name").get();
// 	})
// 	.then((snap) => console.log(snap.context()))
// 	.finally(() => {
// 		console.log(JSON.stringify(db.storage, null, 4));
// 	});

import { PathInfo, Utils } from "../src/index";

const path = PathInfo.get("root/name[1]/title/type");

console.log(path.path);

console.log(path.keys);

console.log(path.pathKeys);

console.log(
	Utils.compareValues(
		{
			type: "outy",
			name: "ismael",
			info: {
				value: "yes",
				title: "ok",
			},
		},
		{
			name: "ismael",
			info: {
				value: "yes",
				title: "no ok",
			},
		},
	),
);
