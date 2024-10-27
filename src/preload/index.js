import { contextBridge, ipcRenderer } from "electron";
// import { electronAPI } from '@electron-toolkit/preload'

if (!process.contextIsolated) {
	throw new Error("contextIsolation must be enabled in the BrowserWindow");
}

try {
	contextBridge.exposeInMainWorld("electron", {
		locale: navigator.language,
		conversion: async (opts, history) =>
			await ipcRenderer.invoke("conversion", opts, history),
		openDialog: (method, config) => {
			return ipcRenderer.invoke("dialog", method, config);
		},
		openPath: (path) => ipcRenderer.invoke("open-path", path),
		defaultDownloadLoc: async () =>
			await ipcRenderer.invoke("defaultDownloadLoc"),
		getDownloadHistory: async () =>
			await ipcRenderer.invoke("getDownloadHistory"),
	});
} catch (error) {
	console.error(error);
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
// if (process.contextIsolated) {
//   try {
//     contextBridge.exposeInMainWorld('electron', electronAPI)
//     contextBridge.exposeInMainWorld('api', api)
//   } catch (error) {
//     console.error(error)
//   }
// } else {
//   window.electron = electronAPI
//   window.api = api
// }
