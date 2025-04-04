import path from "path";
import fs from "fs";
import { app } from "electron";
import { unlink } from "node:fs";

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

	/**
	 * Deletes the file related to the store.
	 */
	delete() {
		if (!this.path) {
			console.error("Nothing to delete");
			return Promise.resolve(false);
		} else {
			return new Promise((resolve, reject) => {
				unlink(this.path, (err) => {
					if (err) {
						console.error(`Failed to delete ${this.path}:`, err);
						resolve(false); // resolve with false on error
					} else {
						console.log(`${this.path} has been deleted`);
						this.path = "";
						resolve(true); // resolve with true on success
					}
				});
			});
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
