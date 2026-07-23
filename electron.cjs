const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    icon: path.join(__dirname, 'icon.png'),
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: "智能家居平面布线与报价系统",
    autoHideMenuBar: true, // 默认隐藏菜单栏
    show: false
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    
    // 防黑屏机制：如果 Vite 首次冷启动编译尚未完成导致加载超时/失败，自动重试加载
    mainWindow.webContents.on('did-fail-load', () => {
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.loadURL('http://localhost:5173');
        }
      }, 1000);
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

let isPresetsOnlyMode = false;

app.whenReady().then(() => {
  // 检查命令行参数是否包含 --mode=presets-manager
  const args = process.argv;
  isPresetsOnlyMode = args.some(arg => arg === '--mode=presets-manager' || arg.startsWith('--mode=presets-manager'));

  if (isPresetsOnlyMode) {
    createPresetsManagerWindow();
  } else {
    createWindow();
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      if (isPresetsOnlyMode) {
        createPresetsManagerWindow();
      } else {
        createWindow();
      }
    }
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// 获取本地物理数据库文件路径 (文档/SmartHomePLC/products_db.json)
const getDbFilePath = () => {
  try {
    const docPath = app.getPath('documents');
    const dirPath = path.join(docPath, 'SmartHomePLC');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return path.join(dirPath, 'products_db.json');
  } catch (error) {
    const userPath = app.getPath('userData');
    return path.join(userPath, 'products_db.json');
  }
};

// IPC 处理器：读取物理数据库 (JSON)
ipcMain.handle('read-presets-db', async () => {
  const filePath = getDbFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return { success: true, data: JSON.parse(data), filePath };
    }
    return { success: false, error: 'Database file not found', code: 'ENOENT', filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC 处理器：保存物理数据库 (JSON)
ipcMain.handle('write-presets-db', async (event, presetsData) => {
  const filePath = getDbFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(presetsData, null, 2), 'utf-8');
    return { success: true, filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

const restoreWindowFocus = (event) => {
  try {
    const win = (event && event.sender) ? BrowserWindow.fromWebContents(event.sender) : mainWindow;
    if (win && !win.isDestroyed()) {
      win.focus();
      win.webContents.focus();
    }
  } catch (err) {
    console.error('Failed to restore window focus:', err);
  }
};

// IPC 处理器：保存项目 (JSON)
ipcMain.handle('save-project', async (event, projectData) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: '保存智能家居布线项目',
    defaultPath: projectData.projectName ? `${projectData.projectName}.plcdoc` : '未命名布线项目.plcdoc',
    filters: [
      { name: '智能家居项目文件 (*.plcdoc)', extensions: ['plcdoc'] },
      { name: 'JSON 数据文件 (*.json)', extensions: ['json'] }
    ]
  });

  restoreWindowFocus(event);

  if (filePath) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(projectData, null, 2), 'utf-8');
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  return { success: false, cancelled: true };
});

// IPC 处理器：打开项目 (JSON)
ipcMain.handle('load-project', async (event) => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: '打开智能家居布线项目',
    filters: [
      { name: '智能家居项目文件 (*.plcdoc, *.json)', extensions: ['plcdoc', 'json'] }
    ],
    properties: ['openFile']
  });

  restoreWindowFocus(event);

  if (filePaths && filePaths.length > 0) {
    try {
      const data = fs.readFileSync(filePaths[0], 'utf-8');
      const projectData = JSON.parse(data);
      return { success: true, projectData, filePath: filePaths[0] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  return { success: false, cancelled: true };
});

// IPC 处理器：导出 PDF
ipcMain.handle('export-pdf', async (event, fileName = '智能家居布线报价单.pdf') => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: '导出 PDF 报价单',
    defaultPath: fileName,
    filters: [
      { name: 'PDF 文档 (*.pdf)', extensions: ['pdf'] }
    ]
  });

  if (!filePath) {
    restoreWindowFocus(event);
    return { success: false, cancelled: true };
  }

  try {
    const options = {
      margins: {
        marginType: 'none' // 使用无边距，交由 CSS 控制
      },
      pageSize: 'A4',
      printBackground: true,
      landscape: false
    };
    
    // 给打印排版引擎预留 1.2 秒缓冲期，确保底图 base64 和图表重新渲染排版就绪，防止白屏
    await new Promise(resolve => setTimeout(resolve, 1200));
    const pdfData = await mainWindow.webContents.printToPDF(options);
    fs.writeFileSync(filePath, pdfData);
    restoreWindowFocus(event);
    return { success: true, filePath };
  } catch (error) {
    restoreWindowFocus(event);
    return { success: false, error: error.message };
  }
});

// IPC 处理器：保存产品库 (JSON)
ipcMain.handle('save-presets', async (event, presetsData) => {
  const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
  const { filePath } = await dialog.showSaveDialog(win, {
    title: '导出智能家居产品库',
    defaultPath: '自定义产品库.plcpresets',
    filters: [
      { name: '智能家居产品库文件 (*.plcpresets)', extensions: ['plcpresets'] },
      { name: 'JSON 数据文件 (*.json)', extensions: ['json'] }
    ]
  });

  restoreWindowFocus(event);

  if (filePath) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(presetsData, null, 2), 'utf-8');
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  return { success: false, cancelled: true };
});

// IPC 处理器：导入产品库 (JSON)
ipcMain.handle('load-presets', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
  const { filePaths } = await dialog.showOpenDialog(win, {
    title: '导入智能家居产品库',
    filters: [
      { name: '智能家居产品库文件 (*.plcpresets, *.json)', extensions: ['plcpresets', 'json'] }
    ],
    properties: ['openFile']
  });

  restoreWindowFocus(event);

  if (filePaths && filePaths.length > 0) {
    try {
      const data = fs.readFileSync(filePaths[0], 'utf-8');
      const presetsData = JSON.parse(data);
      return { success: true, presetsData, filePath: filePaths[0] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  return { success: false, cancelled: true };
});

// IPC 处理器：选择底图 (图片或 PDF)
ipcMain.handle('select-bg-image', async (event) => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: '选择平面图文件 (图片或 PDF)',
    filters: [
      { name: '平面图文件 (*.jpg;*.jpeg;*.png;*.pdf)', extensions: ['jpg', 'jpeg', 'png', 'pdf'] }
    ],
    properties: ['openFile']
  });

  restoreWindowFocus(event);

  if (filePaths && filePaths.length > 0) {
    const filePath = filePaths[0];
    const isPdf = filePath.toLowerCase().endsWith('.pdf');
    try {
      const buffer = fs.readFileSync(filePath);
      if (isPdf) {
        return { success: true, isPdf: true, data: Array.from(buffer), fileName: path.basename(filePath) };
      } else {
        const base64 = buffer.toString('base64');
        const extension = path.extname(filePath).substring(1);
        const mimeType = extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : `image/${extension}`;
        return { success: true, isPdf: false, data: `data:${mimeType};base64,${base64}`, fileName: path.basename(filePath) };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  return { success: false, cancelled: true };
});

let presetsManagerWindow = null;

function createPresetsManagerWindow() {
  if (presetsManagerWindow && !presetsManagerWindow.isDestroyed()) {
    presetsManagerWindow.focus();
    return;
  }

  presetsManagerWindow = new BrowserWindow({
    icon: path.join(__dirname, 'icon.png'),
    width: 900,
    height: 650,
    minWidth: 700,
    minHeight: 500,
    title: "系统产品库管理工作台",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      additionalArguments: ['--mode=presets-manager']
    }
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    presetsManagerWindow.loadURL('http://localhost:5173');
  } else {
    presetsManagerWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  presetsManagerWindow.on('closed', () => {
    presetsManagerWindow = null;
    // 如果是仅产品库管理器模式，关闭窗口即退出整个程序
    if (isPresetsOnlyMode) {
      app.quit();
    }
  });
}

ipcMain.on('open-presets-manager', () => {
  createPresetsManagerWindow();
});
