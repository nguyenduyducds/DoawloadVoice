// Preload: cầu nối an toàn giữa renderer (View) và main process (contextIsolation).
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getDownloadDir: () => ipcRenderer.invoke('config:getDownloadDir'),
    chooseDownloadDir: () => ipcRenderer.invoke('config:chooseDownloadDir'),

    getLocalVoices: () => ipcRenderer.invoke('voices:getLocal'),
    downloadVoice: (payload) => ipcRenderer.invoke('voices:download', payload),
    downloadMany: (items) => ipcRenderer.invoke('voices:downloadMany', items),
});
