import path from "path";
import fs from "fs";
import { app } from "electron";

export default class Store {
	constructor(opts) {
		const userDataPath = app.getPath("userData");
		this.path = path.join(userDataPath, `${opts.configName}.json`);
		this.data = parseDataFile(this.path, opts.defaults);
	}

	get(key) {
		return this.data[key];
	}

	set(key, val) {
		this.data[key] = val;
		try {
			fs.writeFileSync(this.path, JSON.stringify(this.data));
		} catch (error) {
			console.error("Error writing to store:", error);
		}
	}
}

function parseDataFile(filePath, defaults) {
	try {
		return JSON.parse(fs.readFileSync(filePath));
	} catch (error) {
		return defaults;
	}
}
