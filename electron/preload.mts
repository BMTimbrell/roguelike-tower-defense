import { contextBridge, ipcRenderer, shell } from "electron";

contextBridge.exposeInMainWorld("platform", {
    isDesktop: true,

    saveGame: (data: string) =>
        ipcRenderer.invoke("save-game", data),

    loadGame: () =>
        ipcRenderer.invoke("load-game"),

    quitGame: () => ipcRenderer.send("quit-game"),

    setFullscreen: (value: boolean) =>
        ipcRenderer.send("set-fullscreen", value),

    isFullscreen: () => ipcRenderer.invoke("is-fullscreen"),

    openExternal: (url: string) => shell.openExternal(url)
});