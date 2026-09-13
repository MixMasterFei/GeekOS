const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('geekos', {
  isElectron: true,
  version: process.versions.electron,
  bnet: (opts) => ipcRenderer.invoke('bnet', opts),
  checkUpdates: () => ipcRenderer.invoke('update:check'),
  onUpdate: (fn) => ipcRenderer.on('update', (_e, payload) => fn(payload)),
  quit: () => ipcRenderer.send('quit'),
});
