import { app, BrowserWindow, ipcMain, Menu, nativeTheme, shell } from "electron";
import { writeFileSync } from "fs";
import { join } from "path";

const isMac = process.platform === "darwin";

// On Wayland, run natively instead of through XWayland so the app uses the
// system cursor theme (XWayland falls back to the default X11 cursors).
app.commandLine.appendSwitch("ozone-platform-hint", "auto");

// Dev affordance: force the theme for screenshots (FRAMEWORK_THEME=dark|light).
const forcedTheme = process.env.FRAMEWORK_THEME;
if (forcedTheme === "dark" || forcedTheme === "light") {
  nativeTheme.themeSource = forcedTheme;
}

function buildApplicationMenu(): void {
  if (!isMac) {
    Menu.setApplicationMenu(null);
    return;
  }

  const template: Electron.MenuItemConstructorOptions[] = [
    { role: "appMenu" as const },
    {
      label: "File",
      submenu: [
        {
          label: "New Chat",
          accelerator: "CmdOrCtrl+N",
          click: (_item, win) => {
            if (win instanceof BrowserWindow)
              win.webContents.send("menu:new-chat");
          },
        },
        {
          label: "New Project…",
          accelerator: "CmdOrCtrl+Shift+N",
          click: (_item, win) => {
            if (win instanceof BrowserWindow)
              win.webContents.send("menu:new-project");
          },
        },
        { type: "separator" },
        { role: "close" as const },
      ],
    },
    { role: "editMenu" },
    { role: "viewMenu" },
    { role: "windowMenu" },
    {
      role: "help",
      submenu: [
        {
          label: "About Framework",
          click: () => {
            app.showAboutPanel();
          },
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function registerWindowControls(): void {
  ipcMain.handle("window-control:minimize", (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize();
  });

  ipcMain.handle("window-control:toggle-maximize", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });

  ipcMain.handle("window-control:close", (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
  });
}

// Dev affordance: FRAMEWORK_CAPTURE=/path/to.png renders the window
// offscreen, saves a screenshot, and exits. Used for visual checks.
const captureTo = process.env.FRAMEWORK_CAPTURE;

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 800,
    minHeight: 560,
    show: !captureTo || Boolean(process.env.FRAMEWORK_TEST_DRAG),
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#1c1917" : "#ffffff",
    autoHideMenuBar: !isMac,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: true,
      contextIsolation: true,
      // Hidden windows stop compositing when throttled, which would make
      // capture-mode screenshots show a stale first frame.
      backgroundThrottling: !captureTo,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (captureTo) {
    win.webContents.on("console-message", (event) => {
      console.log("[renderer]", event.message);
    });
    win.webContents.once("did-finish-load", () => {
      setTimeout(async () => {
        // Dev affordance: FRAMEWORK_TEST_DRAG simulates a pointer drag of the
        // last panel tab via trusted input events, then logs the resulting
        // tab order. "1" reorders it to the front; "tear" drags it out of
        // the rail and releases (expects a snap-back, order unchanged).
        if (process.env.FRAMEWORK_TEST_DRAG) {
          const tear = process.env.FRAMEWORK_TEST_DRAG === "tear";
          const wc = win.webContents;
          const before = (await wc.executeJavaScript(
            "[...document.querySelectorAll('[data-tab-id]')].map(e => { const r = e.getBoundingClientRect(); return { id: e.dataset.tabId, x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), left: Math.round(r.left) }; })"
          )) as Array<{ id: string; x: number; y: number; left: number }>;
          console.log("[dragtest] before:", JSON.stringify(before.map((t) => t.id)));
          if (before.length >= 2) {
            const from = before[before.length - 1];
            const targetX = tear ? from.x - 320 : before[0].left + 4;
            const targetY = tear ? from.y + 240 : from.y;
            wc.sendInputEvent({ type: "mouseDown", x: from.x, y: from.y, button: "left", clickCount: 1 });
            const steps = 15;
            for (let i = 1; i <= steps; i++) {
              const x = Math.round(from.x + ((targetX - from.x) * i) / steps);
              const y = Math.round(from.y + ((targetY - from.y) * i) / steps);
              wc.sendInputEvent({ type: "mouseMove", x, y });
              await new Promise((r) => setTimeout(r, 25));
              if (i === (tear ? 12 : 8) && captureTo) {
                const midImage = await wc.capturePage();
                writeFileSync(captureTo.replace(/\.png$/, ".middrag.png"), midImage.toPNG());
              }
            }
            wc.sendInputEvent({ type: "mouseUp", x: targetX, y: targetY, button: "left", clickCount: 1 });
            await new Promise((r) => setTimeout(r, 250));
            const after = await wc.executeJavaScript(
              "[...document.querySelectorAll('[data-tab-id]')].map(e => e.dataset.tabId)"
            );
            console.log("[dragtest] after:", JSON.stringify(after));
          }
        }

        // Flush pending renders: two RAF ticks, then force the compositor
        // to produce a fresh frame (hidden windows stop compositing).
        await win.webContents.executeJavaScript(
          "new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))"
        );
        win.webContents.invalidate();
        await new Promise((r) => setTimeout(r, 300));
        const image = await win.webContents.capturePage();
        writeFileSync(captureTo, image.toPNG());
        app.quit();
      }, 800);
    });
  }

  // Dev affordance: FRAMEWORK_VIEW=resources|file deep-links the renderer into a
  // workspace view on launch (used for screenshots of non-default states).
  const initialView = process.env.FRAMEWORK_VIEW;
  if (process.env.ELECTRON_RENDERER_URL) {
    const url = new URL(process.env.ELECTRON_RENDERER_URL);
    if (initialView) url.searchParams.set("view", initialView);
    win.loadURL(url.toString());
  } else {
    win.loadFile(
      join(__dirname, "../renderer/index.html"),
      initialView ? { query: { view: initialView } } : undefined
    );
  }
}

app.setName("Framework");
app.setAboutPanelOptions({
  applicationName: "Framework",
  applicationVersion: app.getVersion(),
});

app.whenReady().then(() => {
  buildApplicationMenu();
  registerWindowControls();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
