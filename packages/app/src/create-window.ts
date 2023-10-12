// eslint-disable-next-line import/no-unresolved
import { BrowserWindow } from 'electron';

export function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
  });

  // https://www.electronjs.org/docs/latest/tutorial/devices#web-serial-api
  mainWindow.webContents.session.on('select-serial-port', (event, portList, webContents, callback) => {
    // Add listeners to handle ports being added or removed before the callback for `select-serial-port`
    // is called.
    mainWindow.webContents.session.on('serial-port-added', (event, port) => {
      console.log('serial-port-added FIRED WITH', port);
      // Optionally update portList to add the new port
    });

    mainWindow.webContents.session.on('serial-port-removed', (event, port) => {
      console.log('serial-port-removed FIRED WITH', port);
      // Optionally update portList to remove the port
    });

    event.preventDefault();
    if (portList && portList.length > 0) {
      callback(portList[0].portId);
    } else {
      callback(''); // Could not find any matching devices
    }
  });

  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    if (permission === 'serial' && details.securityOrigin === 'file:///') {
      return true;
    }

    return false;
  });

  mainWindow.webContents.session.setDevicePermissionHandler((details) => {
    if (details.deviceType === 'serial' && details.origin === 'file://') {
      return true;
    }

    return false;
  });

  // and load the index.html of the app.
  mainWindow.loadFile('dist/index.html');

  // Open the DevTools in development.
  mainWindow.webContents.openDevTools();
}
