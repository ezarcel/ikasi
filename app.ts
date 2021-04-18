if (require("electron-squirrel-startup")) process.exit();

import { appPath } from "./tools";
import { importTranslations, translateString } from "./translate";

import { app, BrowserWindow, nativeTheme, protocol } from "electron";
import { ensureDirSync, readFile } from "fs-extra";
import mime from "mime-types";
import os from "os";
import p from "path";

app.whenReady().then(async () => {
  const SRC_DIR = p.join(appPath, "src");
  ensureDirSync(SRC_DIR);

  protocol.interceptBufferProtocol("file", async (req, respond) => {
    const url = decodeURIComponent(new URL(req.url).pathname.slice(os.platform() === "win32" ? 1 : 0));
    const data = await readFile(url);

    respond({
      data: [".html", ".css", ".js"].includes(p.extname(url))
        ? Buffer.from(
            await translateString(data.toString(), app.getLocale() in (await importTranslations()) ? app.getLocale() : "en")
          )
        : data,
      mimeType: mime.lookup(url) as any
    });
  });

  const window = new BrowserWindow({
    frame: false,
    icon: "./img/logo_without_text.png",
    minHeight: 350,
    minWidth: 600,
    height: 700,
    width: 900,
    webPreferences: {
      contextIsolation: false,
      enableRemoteModule: true,
      nodeIntegration: true
    }
  });
  window.loadFile(p.join(SRC_DIR, "index.html"));
  window.setMenuBarVisibility(false);
  /* if (!app.isPackaged) */ window.webContents.openDevTools({ mode: "undocked" });

  nativeTheme.on("updated", () => window.webContents.send("colors-changed"));
  window.on("close", e => {
    e.preventDefault();
    window.webContents.send("close");
  });
});

app.on("window-all-closed", () => app.quit());
