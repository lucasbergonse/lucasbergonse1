const { app, BrowserWindow, ipcMain, desktopCapturer } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: "Nova Pro",
    icon: path.join(__dirname, '../icons/icon-512.png')
  });

  // Carrega o seu index.html existente
  win.loadFile('index.html');
  // win.webContents.openDevTools(); // Descomente para depuração
}

app.whenReady().then(() => {
  ipcMain.handle('get-screen-sources', async () => {
    return await desktopCapturer.getSources({ types: ['window', 'screen'] });
  });
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
