const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Bu yerda contextIsolation-ni o‘chiring, shunda render.js ishlaydi
    },
  });
  win.loadFile('static/index.html'); // Asosiy HTML faylni yuklaydi
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});