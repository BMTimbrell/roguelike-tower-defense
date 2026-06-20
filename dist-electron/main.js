import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function createWindow() {
    const raw = await loadSettings();
    let settings = null;
    if (raw)
        settings = JSON.parse(raw).settings;
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            preload: path.join(__dirname, "preload.mjs"),
            contextIsolation: true,
            sandbox: false
        }
    });
    win.setMenu(null);
    // fullscreen true by default
    const shouldFullscreen = !settings ? true : settings.fullscreen;
    if (shouldFullscreen) {
        win.setFullScreen(true);
    }
    win.loadFile(path.join(__dirname, "../dist/index.html"));
}
const savePath = path.join(app.getPath("userData"), "save.json");
async function loadSettings() {
    try {
        return await fs.readFile(savePath, "utf8");
    }
    catch {
        return null;
    }
}
ipcMain.handle("save-game", async (_, data) => {
    await fs.writeFile(savePath, data, "utf8");
});
ipcMain.handle("load-game", async () => {
    try {
        return await fs.readFile(savePath, "utf8");
    }
    catch {
        return null;
    }
});
ipcMain.on("quit-game", () => {
    app.quit();
});
ipcMain.on("set-fullscreen", (_event, value) => {
    const win = BrowserWindow.getAllWindows()[0];
    if (!win)
        return;
    win.setFullScreen(value);
});
ipcMain.handle("is-fullscreen", () => {
    const win = BrowserWindow.getAllWindows()[0];
    return win ? win.isFullScreen() : false;
});
app.whenReady().then(createWindow);
