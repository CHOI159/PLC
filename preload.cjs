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
  getMode: () => {
    const arg = process.argv.find(a => a.startsWith('--mode='));
    return arg ? arg.split('=')[1] : 'main';
  }
});
