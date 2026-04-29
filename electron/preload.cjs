const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("desktop", {
  appName: "ProyectoEcuas"
});
