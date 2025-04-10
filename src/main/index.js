import { app, shell, BrowserWindow, ipcMain, dialog } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import { conversion } from "./lib/youtube";
import Store from "./lib/store";
import path from "path";
//Declare preferences store
const store = new Store({
	configName: "user-preferences",
	defaults: {
		windowBounds: { width: 1025, height: 800 },
	},
});
//Declare download history store
let downloadHistory, history, mainWindow;

function createWindow(opts = {}) {
	mainWindow = new BrowserWindow({
		show: false,
		autoHideMenuBar: true,
		...(process.platform === "linux" ? { icon } : {}),

		webPreferences: {
			preload: join(__dirname, "../preload/index.js"),
			sandbox: false,
		},
		...opts,
	});

	downloadHistory = new Store({
		configName: "download-history",
		defaults: {
			history: [],
		},
	});

	mainWindow.webContents.openDevTools({ mode: "left" });

	mainWindow.on("ready-to-show", () => {
		mainWindow.show();
	});

	mainWindow.webContents.setWindowOpenHandler((details) => {
		shell.openExternal(details.url);
		return { action: "deny" };
	});

	// HMR for renderer base on electron-vite cli.
	// Load the remote URL for development or the local html file for production.
	if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
		mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
	} else {
		mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
	}
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	history = downloadHistory?.get("history") ?? [];
	downloadHistory?.set("history", history); // Initialize history if empty
	// let { width, height } = store.get("windowBounds");
	// Set app user model id for windows
	electronApp.setAppUserModelId("com.electron");

	// Default open or close DevTools by F12 in development
	// and ignore CommandOrControl + R in production.
	// see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
	app.on("browser-window-created", (_, window) => {
		optimizer.watchWindowShortcuts(window);
	});

	//Main logic for the app. Same principle here. We declare a handle to make it usable from the frontend making a bridge with the preload.js file. This calls conversion, which will send the options from the frontend to the backend and then execute the conversion function and if the download is success, will add to the history.
	ipcMain.handle("conversion", async (e, opts) => {
		if (!downloadHistory?.data?.history?.length) {
			downloadHistory = new Store({
				configName: "download-history",
				defaults: {
					history: [],
				},
			});
		}
		const win = e.sender.getOwnerBrowserWindow();
		const response = await conversion(opts, win);
		history.push(response);
		downloadHistory.set("history", history);
	});
	//To open the dialog window to save download locations
	ipcMain.handle("dialog", async (_, method, params) => {
		const { filePaths } = await dialog[method](params);
		const [path] = filePaths;
		store.set("lastDowloadLocation", path);
		return path;
	});
	//To open default or selected download location
	ipcMain.handle("open-path", async (_, path) => {
		try {
			await shell.openPath(path);
			return { success: true };
		} catch (error) {
			return { success: false, error: error.message };
		}
	});

	//NOTE This func return the default "downloads" path for different OS (app.getPath). The ipcMain.handle part is to connect the preload with the renderer, to avoid manipulating the main with the renderer, which is the frontend part.
	ipcMain.handle("defaultDownloadLoc", () => {
		return store.get("lastDowloadLocation") || app.getPath("downloads");
	});

	ipcMain.on("download-update", (event, download) => {
		event.reply("download-update", download);
	});

	ipcMain.on("download-progress", (event, download) => {
		event.reply("download-progress", download);
	});

	ipcMain.handle("getDownloadHistory", () => {
		return downloadHistory.get("history");
	});

	ipcMain.handle("clearHistory", async (_) => {
		console.log("Clearing the history");
		downloadHistory.set("history", []);
		history = [];
		return await downloadHistory.delete();
	});

	ipcMain.handle("onFileDelete", async (_, fileData, i) => {
		const file = path.join(fileData.location, fileData.name);
		try {
			await shell.trashItem(file);
			const history = downloadHistory.get("history");
			history.splice(i, 1);
			return true;
		} catch (err) {
			console.error("Error occurred in handler for 'onFileDelete':", err);
			return false;
		}
	});

	ipcMain.handle("onFilePlay", async (_, fileData) => {
		try {
			const filePath = path.normalize(`${fileData.location}/${fileData.name}`);
			const fileUrl = `file://${filePath}`;
			console.log(`Intentando abrir: ${fileUrl}`);
			await shell.openExternal(fileUrl);
			console.log("Archivo abierto correctamente");
		} catch (error) {
			console.error(`Error al abrir el archivo: ${error}`);
		}
	});

	let { width, height } = store.get("windowBounds");
	createWindow({ width, height });

	app.on("activate", function () {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});

	mainWindow.on("resize", () => {
		// The event doesn't pass us the window size, so we call the `getBounds` method which returns an object with
		// the height, width, and x and y coordinates.
		let { width, height } = mainWindow.getBounds();
		// Now that we have them, save them using the `set` method.
		store.set("windowBounds", { width, height });
	});
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
