import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("frameworkWindow", {
  minimize: () => ipcRenderer.invoke("window-control:minimize"),
  toggleMaximize: () => ipcRenderer.invoke("window-control:toggle-maximize"),
  close: () => ipcRenderer.invoke("window-control:close"),
});
