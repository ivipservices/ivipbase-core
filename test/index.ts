import { DataBase, DataBaseSettings, LocalStorage, StorageNode } from "../src/index";

class myStorage extends LocalStorage {
	public cache: { [path: string]: any } = {};

	constructor(db: DataBase) {
		super();
		db.emit("ready");
	}

	async set(path: string, value: any, options?: any): Promise<{ cursor?: string | undefined }> {
		console.log(path, value, options);
		const cursor = (this.cache[path] = value);
		return { ...(cursor ? { cursor } : {}) };
	}

	async get(path: string, options?: any): Promise<{ value: any; context: any; cursor?: string }> {
		return { value: this.cache[path] ?? null, context: { more: false } };
	}
}

class myDataBase extends DataBase {
	constructor(dbname: string, options?: Partial<DataBaseSettings>) {
		super(dbname, options);
		this.storage = new myStorage(this);
	}
}

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

console.log(
	JSON.stringify(
		StorageNode.toJson(
			StorageNode.parse("root", {
				name: "My DataBase Locall",
				created: new Date().toISOString(),
				pages: 24,
				list: [
					{
						timestamp: Date.now(),
						message:
							"Lorem ipsum nullam amet aptent fusce tortor platea curae euismod curabitur, ante nisl donec tincidunt class auctor odio eu lorem ut, tempor nulla aptent cras ornare condimentum massa iaculis tristique. eros nisi non id etiam netus euismod auctor conubia iaculis nisl metus quam, lectus urna habitant donec sociosqu libero arcu ullamcorper justo integer aenean, vitae mattis porta aptent augue condimentum pretium posuere etiam fames sagittis. laoreet adipiscing a sagittis gravida senectus, blandit consequat mollis. laoreet quam convallis pretium venenatis habitant donec auctor nisi est fames ac quisque ante adipiscing eros augue, lectus urna dolor ut nostra mi vitae ornare duis risus quisque amet duis justo.",
					},
					{
						timestamp: Date.now(),
						message: "Blandit platea ac ipsum posuere aliquet sociosqu praesent tempor turpis, tempor nisi ultricies enim cursus...",
					},
					{
						timestamp: Date.now(),
						message: "Proin lectus felis hac iaculis ac maecenas vivamus, quisque tempor senectus curae sollicitudin felis nibh, venenatis fusce tempus sem id ultrices.",
					},
				],
				location: {
					title: "Brazil",
					symbol: "BR",
					language: "pt-BR",
				},
			}),
		),
		null,
		4,
	),
);
