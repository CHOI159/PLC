const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveProject: (projectData) => ipcRenderer.invoke('save-project', projectData),
  loadProject: () => ipcRenderer.invoke('load-project'),
  exportPDF: (fileName) => ipcRenderer.invoke('export-pdf', fileName),
  selectBgImage: () => ipcRenderer.invoke('select-bg-image'),
  savePresets: (presetsData) => ipcRenderer.invoke('save-presets', presetsData),
  loadPresets: () => ipcRenderer.invoke('load-presets'),
  openPresetsManager: () => ipcRenderer.send('open-presets-manager'),
  readPresetsDb: () => ipcRenderer.invoke('read-presets-db'),
  writePresetsDb: (presetsData) => ipcRenderer.invoke('write-presets-db', presetsData),
  setIsDirty: (isDirty) => ipcRenderer.send('set-is-dirty', isDirty),
  onRequestSaveAndClose: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('request-save-and-close', listener);
    return () => ipcRenderer.removeListener('request-save-and-close', listener);
  },
  onShowCloseConfirmDialog: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('show-close-confirm-dialog', listener);
    return () => ipcRenderer.removeListener('show-close-confirm-dialog', listener);
  },
  forceCloseApp: () => ipcRenderer.send('force-close-app'),
  getMode: () => {
    const arg = process.argv.find(a => a.startsWith('--mode='));
    return arg ? arg.split('=')[1] : 'main';
  }
});
