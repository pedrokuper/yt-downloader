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
			// Serialize data with a replacer function to prevent circular references
			fs.writeFileSync(
				this.path,
				JSON.stringify(this.data, getCircularReplacer())
			);
		} catch (error) {
			console.error("Error writing to store:", error);
		}
	}
}

function parseDataFile(filePath, defaults) {
	// We'll try/catch it in case the file doesn't exist yet, which will be the case on the first application run.
	// `fs.readFileSync` will return a JSON string which we then parse into a Javascript object
	try {
		return JSON.parse(fs.readFileSync(filePath));
	} catch (error) {
		// if there was some kind of error, return the passed in defaults instead.
		return defaults;
	}
}

// Helper function to prevent circular reference errors
function getCircularReplacer() {
	const seen = new WeakSet();
	return (key, value) => {
		if (typeof value === "object" && value !== null) {
			if (seen.has(value)) {
				return; // Avoid circular reference
			}
			seen.add(value);
		}
		return value;
	};
}
