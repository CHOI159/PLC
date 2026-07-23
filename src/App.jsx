import React, { useState, useEffect } from 'react';
import { 
  FilePlus, 
  FolderOpen, 
  Save, 
  FileText, 
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Sidebar, { PRESET_DEVICES } from './components/Sidebar';
import * as Icons from 'lucide-react';
import PropertyPanel from './components/PropertyPanel';

// 计算朝上方向的伞形扇形路径 (用于 PDF 打印导出渲染)
const getFovPath = (range = 160, angle = 80) => {
  const halfRad = (angle / 2) * Math.PI / 180;
  const startRad = -Math.PI / 2 - halfRad;
  const endRad = -Math.PI / 2 + halfRad;
  
  const x1 = Math.round(range * Math.cos(startRad));
  const y1 = Math.round(range * Math.sin(startRad));
  const x2 = Math.round(range * Math.cos(endRad));
  const y2 = Math.round(range * Math.sin(endRad));
  
  return `M 0,0 L ${x1},${y1} A ${range},${range} 0 0,1 ${x2},${y2} Z`;
};

// A4 打印专用的产品矢量图标绘制函数
const renderPrintDeviceIcon = (iconName, color) => {
  const IconComponent = Icons[iconName] || Icons.Cpu;
  return <IconComponent size={22} color={color} strokeWidth={2.5} x="-11" y="-11" style={{ pointerEvents: 'none' }} />;
};

// 表格明细专用的产品小图标绘制函数 (HTML/DOM 环境)
const renderTableDeviceIcon = (iconName, customImg, color) => {
  if (customImg) {
    return (
      <img 
        src={customImg} 
        style={{ width: '13px', height: '13px', objectFit: 'contain', borderRadius: '2px', marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }} 
        alt="" 
      />
    );
  }
  const IconComponent = Icons[iconName] || Icons.Cpu;
  return (
    <IconComponent 
      size={12} 
      style={{ color: color || '#3b82f6', marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }} 
    />
  );
};
import EditorCanvas from './components/EditorCanvas';

// 折线角平分线平行偏置算法
const getOffsetPoints = (points, offsetVal = 6) => {
  if (!points || points.length === 0) return [];
  if (points.length === 1) return [{ ...points[0] }];
  
  const offsetPoints = [];
  const n = points.length;
  
  for (let i = 0; i < n; i++) {
    let dx = 0;
    let dy = 0;
    
    if (i === 0) {
      const p0 = points[0];
      const p1 = points[1];
      const len = Math.hypot(p1.x - p0.x, p1.y - p0.y) || 1;
      const tx = (p1.x - p0.x) / len;
      const ty = (p1.y - p0.y) / len;
      dx = -ty * offsetVal;
      dy = tx * offsetVal;
    } else if (i === n - 1) {
      const pA = points[n - 2];
      const pB = points[n - 1];
      const len = Math.hypot(pB.x - pA.x, pB.y - pA.y) || 1;
      const tx = (pB.x - pA.x) / len;
      const ty = (pB.y - pA.y) / len;
      dx = -ty * offsetVal;
      dy = tx * offsetVal;
    } else {
      const pPrev = points[i - 1];
      const pCurr = points[i];
      const pNext = points[i + 1];
      
      const len1 = Math.hypot(pCurr.x - pPrev.x, pCurr.y - pPrev.y) || 1;
      const nx1 = -(pCurr.y - pPrev.y) / len1;
      const ny1 = (pCurr.x - pPrev.x) / len1;
      
      const len2 = Math.hypot(pNext.x - pCurr.x, pNext.y - pCurr.y) || 1;
      const nx2 = -(pNext.y - pCurr.y) / len2;
      const ny2 = (pNext.x - pCurr.x) / len2;
      
      let mx = nx1 + nx2;
      let my = ny1 + ny2;
      let mLen = Math.hypot(mx, my);
      if (mLen < 0.1) {
        dx = nx1 * offsetVal;
        dy = ny1 * offsetVal;
      } else {
        const scale = offsetVal / (nx1 * (mx / mLen) + ny1 * (my / mLen) || 1);
        const cappedScale = Math.min(scale, offsetVal * 2.5);
        dx = (mx / mLen) * cappedScale;
        dy = (my / mLen) * cappedScale;
      }
    }
    
    offsetPoints.push({
      x: Math.round(points[i].x + dx),
      y: Math.round(points[i].y + dy)
    });
  }
  return offsetPoints;
};
// ==========================================
// 简体中文/英文双语国际化翻译字典 (Internationalization Dictionary)
// ==========================================
const TRANSLATIONS = {
  zh: {
    projectTitle: "项目名称",
    exportPdf: "导出平面图 (PDF)",
    importDoc: "打开项目 (.plcdoc)",
    exportDoc: "保存项目 (.plcdoc)",
    manageDb: "管理产品库",
    defaultVersionName: "默认报价方案",
    activeVersion: "报价方案",
    rename: "重命名当前方案",
    copySnapshot: "复制快照",
    newVersion: "新建方案",
    deleteVersion: "删除方案",
    totalBudget: "项目总计报价",
    devicesPrice: "设备小计",
    laborPrice: "工本费",
    discount: "折扣比例",
    roomStats: "按房间区域硬件预算汇总",
    roomStatsTitle: "区域硬件预算汇总",
    addRoom: "分配新区域",
    addRoomPlaceholder: "如：客厅、主卧",
    roomLabel: "所属房间/区域",
    unassigned: "未分配区域",
    addBtn: "添加",
    readOnlyTag: "只读",
    deviceName: "设备名称",
    deviceModel: "规格型号",
    devicePrice: "预算单价",
    deviceSize: "设备图标大小",
    deviceColor: "设备标志主题色 (Outline 描边)",
    deletePreset: "删除此产品",
    productDbTitle: "系统产品数据库管理（独立工作台）",
    importDb: "导入数据库",
    exportDb: "导出数据库",
    saveAndSubmit: "保存并入库",
    addPresetTitle: "添加新产品到产品库",
    presetName: "产品名称",
    presetModel: "规格型号",
    presetPrice: "预算单价 (RM)",
    presetCategory: "产品分类",
    presetImg: "产品外观图片 (自动转小图标)",
    presetVector: "兜底矢量分类图标",
    confirmDeletePreset: "确定要从产品库中永久删除此产品预设吗？",
    inputNewCategoryName: "输入新分类中文名称",
    restoreDefault: "恢复系统默认预设",
    productDbEmpty: "产品库已清空",
    clickToChangeIcon: "点击更换产品图标或上传 PNG 图片",
    changePng: "更换 PNG 图片...",
    cancel: "取消",
    canvasDragTip: "从侧边栏拖拽产品放入画布",
    canvasZoom: "缩放",
    canvasClear: "清空连线",
    canvasDelete: "删除选定",
    canvasGuide: "辅助对齐线已开启 (磁吸 8px)",
    exportPdfSuccess: "正在准备打印图纸...",
    closeApp: "关闭软件",
    menuLanguage: "切换语言 (Language)",
    menuFile: "文件"
  },
  en: {
    projectTitle: "Project Title",
    exportPdf: "Export Drawing (PDF)",
    importDoc: "Open Project (.plcdoc)",
    exportDoc: "Save Project (.plcdoc)",
    manageDb: "Manage Database",
    defaultVersionName: "Default Proposal",
    activeVersion: "Proposal",
    rename: "Rename Current",
    copySnapshot: "Copy Snapshot",
    newVersion: "New Proposal",
    deleteVersion: "Delete Proposal",
    totalBudget: "Total Project Quote",
    devicesPrice: "Devices Subtotal",
    laborPrice: "Labor & Fees",
    discount: "Discount Rate",
    roomStats: "Hardware Budget by Room Area",
    roomStatsTitle: "Area Budget Summary",
    addRoom: "Add New Room/Area",
    addRoomPlaceholder: "e.g., Living Room, Master Bedroom",
    roomLabel: "Assigned Room/Area",
    unassigned: "Unassigned Area",
    addBtn: "Add",
    readOnlyTag: "ReadOnly",
    deviceName: "Device Name",
    deviceModel: "Specification Model",
    devicePrice: "Budget Unit Price",
    deviceSize: "Device Icon Size",
    deviceColor: "Device Outline Theme Color",
    deletePreset: "Delete Product",
    productDbTitle: "Product Database Manager (Workspace)",
    importDb: "Import Database",
    exportDb: "Export Database",
    saveAndSubmit: "Save & Commit",
    addPresetTitle: "Add New Product to Library",
    presetName: "Product Name",
    presetModel: "Spec Model",
    presetPrice: "Unit Price (RM)",
    presetCategory: "Product Category",
    presetImg: "Product Image (Auto converted)",
    presetVector: "Fallback Vector Icon",
    confirmDeletePreset: "Are you sure you want to permanently delete this product preset?",
    inputNewCategoryName: "Enter New Category Name",
    restoreDefault: "Restore Defaults",
    productDbEmpty: "Product library is empty",
    clickToChangeIcon: "Click to change icon or upload PNG image",
    changePng: "Change PNG Image...",
    cancel: "Cancel",
    canvasDragTip: "Drag products from sidebar onto canvas",
    canvasZoom: "Zoom",
    canvasClear: "Clear Wires",
    canvasDelete: "Delete Selected",
    canvasGuide: "Alignment guides active (snap 8px)",
    exportPdfSuccess: "Preparing printable drawings...",
    closeApp: "Close Application",
    menuLanguage: "Language (语言)",
    menuFile: "File"
  }
};

export default function App() {
  const [projectName, setProjectName] = useState('智能家居平面布线与报价项目');
  // 品牌控制菜单展开状态
  const [isBrandMenuOpen, setIsBrandMenuOpen] = useState(false);
  // 全局多语言状态：默认读取 localStorage 缓存，无则默认为简体中文 'zh'
  const [lang, setLang] = useState(() => localStorage.getItem('smart_home_lang') || 'zh');

  useEffect(() => {
    localStorage.setItem('smart_home_lang', lang);
  }, [lang]);

  const t = (key) => {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['zh']?.[key] || key;
  };

  // 品牌下拉菜单失焦自动收起监听 (比 fixed 遮罩更稳定、更符合传统操作系统习惯)
  useEffect(() => {
    if (!isBrandMenuOpen) return;
    const handleGlobalClick = () => {
      setIsBrandMenuOpen(false);
    };
    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [isBrandMenuOpen]);

  // 多方案版本管理状态 (支持方案切换、克隆及对比)
  const [versions, setVersions] = useState([
    { id: 'v_default', name: '方案A - 基础标配版', tabs: [{ id: 'tab_default', name: '一楼布线图', bgImage: null, devices: [], wires: [] }], extraCosts: { labor: '', discount: 0 } }
  ]);
  const [activeVersionId, setActiveVersionId] = useState('v_default');

  // 自定义 Dialog 弹窗状态 (替代 window.prompt 和 confirm 以免在 Electron 打包环境中失效)
  const [promptDialog, setPromptDialog] = useState({ show: false, title: '', defaultValue: '', onSubmit: null });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', onConfirm: null });
  const [alertDialog, setAlertDialog] = useState({ show: false, title: '', message: '' });

  const showAlert = (title, message) => {
    setAlertDialog({ show: true, title, message });
  };
  
  // 多标签页数据结构
  const [tabs, setTabs] = useState([
    { id: 'tab_default', name: '一楼布线图', bgImage: null, devices: [], wires: [] }
  ]);
  const [activeTabId, setActiveTabId] = useState('tab_default');

  const [selectedElement, setSelectedElement] = useState(null); // { type: 'device'|'wire', id }
  const [canvasMode, setCanvasMode] = useState('select'); // 'select' | 'wire-live' | 'wire-neutral'
  
  // 视角偏移状态
  const [scale, setScale] = useState(1.0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [extraCosts, setExtraCosts] = useState({ labor: '', discount: 0 });

  // 1. 切换当前的方案版本
  const handleSwitchVersion = (targetVersionId) => {
    if (targetVersionId === activeVersionId) return;
    
    // 将当前的活跃图纸和报价状态备份同步回当前版本，并无缝切至目标版本
    setVersions(prev => {
      const updatedVersions = prev.map(v => 
        v.id === activeVersionId ? { ...v, tabs, extraCosts } : v
      );
      
      const targetVer = updatedVersions.find(v => v.id === targetVersionId);
      if (targetVer) {
        setTabs(targetVer.tabs || []);
        setExtraCosts(targetVer.extraCosts || { labor: '', discount: 0 });
        setActiveVersionId(targetVersionId);
        setSelectedElement(null);
      }
      return updatedVersions;
    });
  };

  // 2. 复制当前方案为一个新方案快照
  const handleDuplicateVersion = () => {
    const currentVer = versions.find(v => v.id === activeVersionId) || versions[0];
    setPromptDialog({
      show: true,
      title: '请输入新复制的方案版本名称',
      defaultValue: `${currentVer.name} - 副本`,
      onSubmit: (name) => {
        const newId = `v_${Date.now()}`;
        const newVer = {
          id: newId,
          name: name,
          tabs: JSON.parse(JSON.stringify(tabs)), // 深拷贝图纸数据
          extraCosts: { ...extraCosts }
        };
        
        setVersions(prev => [...prev.map(v => v.id === activeVersionId ? { ...v, tabs, extraCosts } : v), newVer]);
        setActiveVersionId(newId);
      }
    });
  };

  // 3. 创建全新的空白方案
  const handleCreateNewVersion = () => {
    setPromptDialog({
      show: true,
      title: '请输入全新空白方案的名称',
      defaultValue: `新方案 - 方案${versions.length + 1}`,
      onSubmit: (name) => {
        setVersions(prev => prev.map(v => v.id === activeVersionId ? { ...v, tabs, extraCosts } : v));

        const newId = `v_${Date.now()}`;
        const newVer = {
          id: newId,
          name: name,
          tabs: [{ id: 'tab_default', name: '一楼布线图', bgImage: null, devices: [], wires: [] }],
          extraCosts: { labor: '', discount: 0 }
        };

        setVersions(prev => [...prev, newVer]);
        setTabs(newVer.tabs);
        setExtraCosts(newVer.extraCosts);
        setActiveVersionId(newId);
        setSelectedElement(null);
      }
    });
  };

  // 重命名当前活跃的方案版本
  const handleRenameVersion = () => {
    const currentVer = versions.find(v => v.id === activeVersionId) || versions[0];
    setPromptDialog({
      show: true,
      title: '请输入方案版本的新名称',
      defaultValue: currentVer.name,
      onSubmit: (newName) => {
        const trimmed = newName.trim();
        if (trimmed) {
          setVersions(prev => prev.map(v => v.id === activeVersionId ? { ...v, name: trimmed } : v));
        }
      }
    });
  };

  // 4. 删除指定的方案版本
  const handleDeleteVersion = (versionId) => {
    if (versions.length <= 1) {
      alert("项目中必须保留至少一个方案版本！");
      return;
    }
    setConfirmDialog({
      show: true,
      title: '删除方案版本确认',
      message: '确定要删除此方案版本吗？此操作将清空该版本下的所有布线和报价数据，且无法恢复。',
      onConfirm: () => {
        const remaining = versions.filter(v => v.id !== versionId);
        setVersions(remaining);
        if (activeVersionId === versionId) {
          const nextVer = remaining[0];
          setTabs(nextVer.tabs || []);
          setExtraCosts(nextVer.extraCosts || { labor: '', discount: 0 });
          setActiveVersionId(nextVer.id);
          setSelectedElement(null);
        }
      }
    });
  };

  // 右侧栏折叠状态
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

  // 右栏宽度与定位高光状态
  const [rightPanelWidth, setRightPanelWidth] = useState(340);
  const [highlightedDeviceId, setHighlightedDeviceId] = useState(null);
  const [lastFocusedModel, setLastFocusedModel] = useState('');
  const [focusedModelIndex, setFocusedModelIndex] = useState(0);

  // 鼠标按住 Resizer 拖拽改变右栏宽度
  const handleResizerMouseDown = (e) => {
    e.preventDefault();
    const handleMouseMove = (moveEvent) => {
      // 宽度为视口总宽减去鼠标 X 坐标
      const newWidth = window.innerWidth - moveEvent.clientX;
      if (newWidth >= 260 && newWidth <= 600) {
        setRightPanelWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // 点击产品报价清单时的高光循环定位视角算法
  const handleFocusDeviceModel = (model) => {
    const modelDevices = devices.filter(d => d.model === model);
    if (modelDevices.length === 0) return;

    let nextIdx = 0;
    if (lastFocusedModel === model) {
      nextIdx = (focusedModelIndex + 1) % modelDevices.length;
    }
    setLastFocusedModel(model);
    setFocusedModelIndex(nextIdx);

    const targetDev = modelDevices[nextIdx];
    setSelectedElement({ type: 'device', id: targetDev.id });

    // 让图纸视窗平滑滚动，使设备居中在可视容器正中
    const container = document.querySelector('.canvas-container');
    if (container) {
      const cWidth = container.clientWidth;
      const cHeight = container.clientHeight;
      const newX = cWidth / 2 - targetDev.x * scale;
      const newY = cHeight / 2 - targetDev.y * scale;
      setOffset({ x: newX, y: newY });
    }

    // 触发临时呼吸发光高亮，闪烁 3 次 (2.4秒) 后自动清空，防止圈圈残留无限扩散
    setHighlightedDeviceId(targetDev.id);
    setTimeout(() => {
      setHighlightedDeviceId(null);
    }, 2400);
  };

  // 产品库浮动显示状态
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // 多窗口模式分流检测
  const [appMode, setAppMode] = useState('main');
  useEffect(() => {
    if (window.electronAPI && typeof window.electronAPI.getMode === 'function') {
      setAppMode(window.electronAPI.getMode());
    }
  }, []);

  // 跨窗口 localStorage 数据实时同步监听
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'smart_home_all_presets_unified') {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && Array.isArray(parsed)) {
            setCustomPresets(parsed);
          }
        } catch (err) {
          console.error('Failed to sync storage database across windows:', err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 产品库按钮拖拽位置 (默认避开上方 Tab)
  const [triggerPos, setTriggerPos] = useState({ x: 16, y: 70 });

  // 处理产品库按钮的拖动与点击切换
  const handleTriggerMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = { ...triggerPos };
    let hasMoved = false;

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      
      if (Math.hypot(dx, dy) > 5) {
        hasMoved = true;
      }

      // 限制拖动范围在屏幕可见视口内，防边缘移出
      const newX = Math.max(10, Math.min(window.innerWidth - 180, startPos.x + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 80, startPos.y + dy));
      
      setTriggerPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      if (!hasMoved) {
        setIsSidebarOpen(prev => !prev);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 自定义产品库状态 (持久化存储 - 已和系统预设合并为统一产品库)
  const [customPresets, setCustomPresets] = useState(PRESET_DEVICES);
  const [isPresetsInitialized, setIsPresetsInitialized] = useState(false);

  // 初始化加载产品预设：优先读取 Electron 物理 JSON 数据库，其次是 localStorage，最后是默认值
  useEffect(() => {
    const loadInitialPresets = async () => {
      let presetsData = null;
      if (window.electronAPI && typeof window.electronAPI.readPresetsDb === 'function') {
        const res = await window.electronAPI.readPresetsDb();
        if (res.success && Array.isArray(res.data)) {
          presetsData = res.data;
        }
      }
      
      if (!presetsData) {
        try {
          const saved = localStorage.getItem('smart_home_all_presets_unified');
          if (saved) {
            presetsData = JSON.parse(saved);
          }
        } catch (e) {
          console.error('Failed to parse localStorage presets:', e);
        }
      }

      if (presetsData && Array.isArray(presetsData)) {
        setCustomPresets(presetsData);
      }
      setIsPresetsInitialized(true);
    };

    loadInitialPresets();
  }, []);

  // 监听产品库变动并进行持久化
  useEffect(() => {
    if (!isPresetsInitialized) return; // 避免初始默认状态被覆写
    
    // 同步到 localStorage (保持跨窗口实时同步及兼容)
    localStorage.setItem('smart_home_all_presets_unified', JSON.stringify(customPresets));
    
    // 如果有 Electron 环境，写入物理数据库文件
    if (window.electronAPI && typeof window.electronAPI.writePresetsDb === 'function') {
      window.electronAPI.writePresetsDb(customPresets);
    }
  }, [customPresets, isPresetsInitialized]);

  // 当预设产品库发生变化时，自动将改动同步更新到画布上已布置的所有对应产品中（同步单价、名称、型号）
  useEffect(() => {
    setTabs(prevTabs => prevTabs.map(tab => {
      let isChanged = false;
      const updatedDevices = (tab.devices || []).map(dev => {
        const matchedPreset = customPresets.find(p => p.type === dev.type);
        if (matchedPreset) {
          const priceDiff = matchedPreset.price !== dev.price;
          const nameDiff = matchedPreset.name !== dev.name;
          const modelDiff = matchedPreset.model !== dev.model;
          if (priceDiff || nameDiff || modelDiff) {
            isChanged = true;
            return {
              ...dev,
              price: matchedPreset.price,
              name: matchedPreset.name,
              model: matchedPreset.model
            };
          }
        }
        return dev;
      });
      return isChanged ? { ...tab, devices: updatedDevices } : tab;
    }));
  }, [customPresets]);

  // 获取当前激活的标签页数据
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const bgImage = activeTab.bgImage;
  const devices = activeTab.devices;
  const wires = activeTab.wires;

  // 快捷更新当前激活标签页的内容
  const updateActiveTab = (updatedFields) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, ...updatedFields } : t));
  };

  // 绑定全局 Delete 键删除选中元素
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') {
          return;
        }
        if (selectedElement) {
          handleDeleteElement(selectedElement.id, selectedElement.type);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, tabs, activeTabId]);

  // 新建项目
  const handleNewProject = () => {
    setConfirmDialog({
      show: true,
      title: '新建整个项目确认',
      message: '确定要新建整个项目吗？所有标签页、方案版本和未保存的数据都会被清空！',
      onConfirm: () => {
        setProjectName('智能家居平面布线与报价项目');
        setTabs([
          { id: 'tab_default', name: '一楼布线图', bgImage: null, devices: [], wires: [] }
        ]);
        setActiveTabId('tab_default');
        setSelectedElement(null);
        setCanvasMode('select');
        setScale(1.0);
        setOffset({ x: 0, y: 0 });
        setExtraCosts({ labor: '', discount: 0 });
      }
    });
  };

  // 新建 Tab
  const handleAddTab = () => {
    const newTab = {
      id: `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: '未命名区域',
      bgImage: null,
      devices: [],
      wires: []
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setSelectedElement(null);
  };

  // 克隆当前 Tab
  const handleDuplicateTab = (cloneMode) => {
    const newTab = {
      id: `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: `${activeTab.name} - 副本`,
      bgImage: activeTab.bgImage,
      bgWidth: activeTab.bgWidth,
      bgHeight: activeTab.bgHeight,
      devices: cloneMode === 'all' 
        ? activeTab.devices.map(d => ({ 
            ...d, 
            id: `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}` 
          })) 
        : [],
      wires: cloneMode === 'all'
        ? activeTab.wires.map(w => ({ 
            ...w, 
            id: `wire_${Date.now()}_${Math.random().toString(36).substring(2, 9)}` 
          }))
        : []
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setSelectedElement(null);
  };

  // 重命名 Tab
  const handleRenameTab = (id, newName) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, name: newName } : t));
  };

  // 删除 Tab
  const handleDeleteTab = (id) => {
    if (tabs.length <= 1) {
      alert('项目必须包含至少一个标签页！');
      return;
    }
    setConfirmDialog({
      show: true,
      title: '删除图纸标签确认',
      message: '确定要删除此标签页吗？删除后该层的所有布线图纸及设备将被永久清空！',
      onConfirm: () => {
        const remaining = tabs.filter(t => t.id !== id);
        setTabs(remaining);
        if (activeTabId === id) {
          setActiveTabId(remaining[0].id);
        }
        setSelectedElement(null);
      }
    });
  };

  // 添加设备到当前画布 (支持精确坐标回传，支持完整克隆参数)
  const handleAddDevice = (preset, customCoords = null) => {
    let targetX, targetY;
    if (customCoords) {
      targetX = customCoords.x;
      targetY = customCoords.y;
    } else {
      // 默认放置在 2000x2000 画布的几何中心 (自适应居中后绝对在视窗正中央)
      targetX = 1000;
      targetY = 1000;
    }

    const newDevice = {
      id: `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: preset.type,
      name: preset.name,
      model: preset.model,
      price: preset.price,
      icon: preset.icon || 'Cpu',
      customImg: preset.customImg || '', // 自定义图片 base64
      size: preset.size !== undefined ? preset.size : 48,
      rotation: preset.rotation !== undefined ? preset.rotation : 0,
      flipX: preset.flipX !== undefined ? preset.flipX : false,
      color: preset.color || '#3b82f6',
      showFov: preset.showFov !== undefined ? preset.showFov : false,
      fovRange: preset.fovRange !== undefined ? preset.fovRange : 160,
      fovAngle: preset.fovAngle !== undefined ? preset.fovAngle : 80,
      fovColor: preset.fovColor || '',
      room: preset.room || '未分配', // 新增房间/区域分配属性，默认为未分配
      x: targetX,
      y: targetY
    };
    
    updateActiveTab({
      devices: [...devices, newDevice]
    });
    setSelectedElement({ type: 'device', id: newDevice.id });
    setCanvasMode('select');
  };

  // 报价单中：修改设备数量的函数 (双向同步)
  const handleChangeDeviceCount = (model, targetCount) => {
    // 联合系统预设和自定义预设共同检索
    const preset = PRESET_DEVICES.find(p => p.model === model) || customPresets.find(p => p.model === model);
    if (!preset) return;

    const activeTabDevices = activeTab.devices;
    const modelDevices = activeTabDevices.filter(d => d.model === model);
    const currentCount = modelDevices.length;

    if (targetCount > currentCount) {
      // 需要增加
      const diff = targetCount - currentCount;
      const newDevices = [];
      const centerX = 1000;
      const centerY = 1000;

      for (let i = 0; i < diff; i++) {
        newDevices.push({
          id: `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${i}`,
          type: preset.type,
          name: preset.name,
          model: preset.model,
          price: preset.price,
          icon: preset.icon || 'Cpu',
          customImg: preset.customImg || '',
          size: 48,
          rotation: 0,
          flipX: false,
          color: '#3b82f6',
          showFov: false,
          fovRange: 160,
          fovAngle: 80,
          fovColor: '',
          // 连续添加时给予小范围阶梯偏移，防止重叠成一个点
          x: Math.max(50, Math.min(1950, centerX + i * 30)),
          y: Math.max(50, Math.min(1950, centerY + i * 30))
        });
      }
      updateActiveTab({
        devices: [...activeTabDevices, ...newDevices]
      });
    } else if (targetCount < currentCount) {
      // 需要减少，从后往前剔除
      const diff = currentCount - targetCount;
      let removedCount = 0;
      const updatedDevices = [...activeTabDevices].reverse().filter(d => {
        if (d.model === model && removedCount < diff) {
          removedCount++;
          return false;
        }
        return true;
      }).reverse();
      updateActiveTab({
        devices: updatedDevices
      });
    }
  };

  // 报价单中：删除该型号的全部设备 (仅限当前活跃 Tab / 楼层)
  const handleDeleteDeviceGroup = (model) => {
    const modelDevicesCount = activeTab.devices.filter(d => d.model === model).length;
    if (modelDevicesCount === 0) {
      showAlert('提示', `当前区域「${activeTab.name}」中并没有该型号设备。其他区域的设备请切换到对应Tab后进行删除。`);
      return;
    }
    setConfirmDialog({
      show: true,
      title: '批量删除设备确认',
      message: `确定要删除当前区域「${activeTab.name}」中所有型号为「${model}」的产品吗？`,
      onConfirm: () => {
        updateActiveTab({
          devices: activeTab.devices.filter(d => d.model !== model)
        });
        setSelectedElement(null);
      }
    });
  };

  // 更新当前设备属性
  const handleUpdateDevice = (id, updatedFields) => {
    updateActiveTab({
      devices: devices.map(d => d.id === id ? { ...d, ...updatedFields } : d)
    });
  };

  // 添加当前绘制导线
  const handleAddWire = (wireData) => {
    const newWire = {
      id: `wire_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...wireData
    };
    updateActiveTab({
      wires: [...wires, newWire]
    });
    setSelectedElement({ type: 'wire', id: newWire.id });
  };

  // 更新当前导线属性/控制点
  const handleUpdateWire = (id, updatedFields) => {
    updateActiveTab({
      wires: wires.map(w => w.id === id ? { ...w, ...updatedFields } : w)
    });
  };

  // 删除当前画布中的设备或导线
  const handleDeleteElement = (id, type) => {
    if (type === 'device') {
      updateActiveTab({
        devices: devices.filter(d => d.id !== id)
      });
    } else if (type === 'wire') {
      updateActiveTab({
        wires: wires.filter(w => w.id !== id)
      });
    }
    setSelectedElement(null);
  };

  // 修改工本费或折扣
  const handleUpdateExtraCosts = (field, value) => {
    setExtraCosts(prev => ({ ...prev, [field]: value }));
  };

  // PDF.js 动态载入
  const loadPdfJS = () => {
    return new Promise((resolve, reject) => {
      if (window.pdfjsLib) {
        resolve(window.pdfjsLib);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      };
      script.onerror = () => reject(new Error('PDF.js 加载失败，请检查网络链接！'));
      document.head.appendChild(script);
    });
  };

  // 从 Uint8Array 中渲染 PDF 的第一页并转为 Image DataURL
  const renderPDFData = async (typedarray) => {
    try {
      const pdfjsLib = await loadPdfJS();
      const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
      const page = await pdf.getPage(1);
      
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({ canvasContext: context, viewport: viewport }).promise;
      updateActiveTab({ bgImage: canvas.toDataURL('image/png') });
    } catch (err) {
      alert('PDF 渲染失败，建议您将平面图转换为图片上传。');
    }
  };

  // 原生底图载入
  const handleSelectBgImage = async () => {
    if (window.electronAPI) {
      const res = await window.electronAPI.selectBgImage();
      if (res.success) {
        if (res.isPdf) {
          await renderPDFData(new Uint8Array(res.data));
        } else {
          updateActiveTab({ bgImage: res.data });
        }
      } else if (!res.cancelled && res.error) {
        alert(`底图加载失败：${res.error}`);
      }
    } else {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*, application/pdf';
      fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.type === 'application/pdf') {
          const reader = new FileReader();
          reader.onload = async function() {
            await renderPDFData(new Uint8Array(this.result));
          };
          reader.readAsArrayBuffer(file);
        } else {
          const reader = new FileReader();
          reader.onload = (event) => {
            updateActiveTab({ bgImage: event.target.result });
          };
          reader.readAsDataURL(file);
        }
      };
      fileInput.click();
    }
  };

  // 整理项目整个 Schema
  const getProjectState = () => {
    // 自动在导出前同步当前方案图纸及报价状态回 versions 数据列表中
    const updatedVersions = versions.map(v => 
      v.id === activeVersionId ? { ...v, tabs, extraCosts } : v
    );
    return {
      projectName,
      currentVersionId: activeVersionId,
      versions: updatedVersions
    };
  };

  // 恢复导入的项目数据
  const loadProjectState = (data) => {
    if (data.projectName) setProjectName(data.projectName);
    
    // 兼容层：如果项目包含多版本 versions 属性，直接加载
    if (data.versions && data.versions.length > 0) {
      setVersions(data.versions);
      const targetVersionId = data.currentVersionId || data.versions[0].id;
      setActiveVersionId(targetVersionId);
      
      const activeVer = data.versions.find(v => v.id === targetVersionId) || data.versions[0];
      setTabs(activeVer.tabs || []);
      setExtraCosts(activeVer.extraCosts || { labor: '', discount: 0 });
    } else {
      // 兼容层：如果是旧版的单一方案数据
      const legacyTabs = data.tabs && data.tabs.length > 0 ? data.tabs : [
        {
          id: 'tab_default',
          name: '一楼布线图',
          bgImage: data.bgImage || null,
          devices: data.devices || [],
          wires: data.wires || []
        }
      ];
      const legacyExtraCosts = data.extraCosts || { labor: '', discount: 0 };
      
      const initialVer = {
        id: 'v_default',
        name: '方案A - 基础标配版',
        tabs: legacyTabs,
        extraCosts: legacyExtraCosts
      };
      
      setVersions([initialVer]);
      setActiveVersionId('v_default');
      setTabs(legacyTabs);
      setExtraCosts(legacyExtraCosts);
    }
    
    setSelectedElement(null);
    setScale(1.0);
    setOffset({ x: 0, y: 0 });
  };

  // 保存项目
  const handleSaveProject = async () => {
    const state = getProjectState();
    if (window.electronAPI) {
      const res = await window.electronAPI.saveProject(state);
      if (res.success) {
        showAlert('保存成功', `项目已成功保存至：\n${res.filePath}`);
      } else if (!res.cancelled) {
        showAlert('保存失败', res.error);
      }
    } else {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${projectName}.plcdoc`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  };

  // 导入项目
  const handleLoadProject = async () => {
    if (window.electronAPI) {
      const res = await window.electronAPI.loadProject();
      if (res.success && res.projectData) {
        loadProjectState(res.projectData);
      } else if (!res.cancelled && res.error) {
        showAlert('导入失败', `载入项目失败：${res.error}`);
      }
    } else {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.plcdoc, .json';
      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result);
            loadProjectState(data);
          } catch (err) {
            showAlert('导入失败', '文件解析失败，请上传正确的布线项目文件。');
          }
        };
        reader.readAsText(file);
      };
      fileInput.click();
    }
  };

  // 导出 PDF 报告
  const handleExportPDF = async () => {
    if (window.electronAPI) {
      document.activeElement?.blur();
      const res = await window.electronAPI.exportPDF(`${projectName}_报价单.pdf`);
      if (res.success) {
        showAlert('PDF 导出成功', `PDF 报价单已成功导出至：\n${res.filePath}`);
      } else if (!res.cancelled) {
        showAlert('PDF 导出失败', res.error);
      }
    } else {
      window.print();
    }
  };

  // 一键清除该 Tab 页的背景底图
  const handleClearBgImage = (tabId) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, bgImage: null } : t));
  };

  // 反馈记录当前 Tab 的底图真实尺寸，供 A4 PDF 导出等比对齐使用
  const handleUpdateActiveTabDimensions = (w, h) => {
    updateActiveTab({ bgWidth: w, bgHeight: h });
  };

  // 汇总所有 Tabs 的设备
  const getAllDevices = () => {
    return tabs.reduce((all, tab) => [...all, ...tab.devices], []);
  };

  const allDevices = getAllDevices();
  
  const getDeviceStats = () => {
    const stats = {};
    allDevices.forEach(d => {
      const key = `${d.type}_${d.model}`;
      if (!stats[key]) {
        stats[key] = {
          name: d.name,
          model: d.model,
          price: d.price,
          count: 0
        };
      }
      stats[key].count += 1;
    });
    return Object.values(stats);
  };

  const deviceStats = getDeviceStats();
  const devicesTotal = allDevices.reduce((sum, d) => sum + (Number(d.price) || 0), 0);
  
  // 工本费计算：如果为空字符则默认联动 (devicesTotal * 15%)，否则直接使用用户手动输入的金额数值，均保留两位小数
  const laborCost = extraCosts.labor === ''
    ? Number((devicesTotal * 0.15).toFixed(2))
    : Number(Number(extraCosts.labor) || 0);

  // 折扣百分比及项目总计报价：总计 = 设备总价 * (1 - 折扣百分比/100) + 工本费，保留两位小数
  const discountPercent = Number(extraCosts.discount) || 0;
  const finalTotal = Number((devicesTotal * (1 - discountPercent / 100) + laborCost).toFixed(2));

  if (appMode === 'presets-manager') {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#0f172a', overflow: 'hidden' }}>
        <Sidebar 
          onAddDevice={() => {}} 
          customPresets={customPresets} 
          onUpdateCustomPresets={setCustomPresets}
          lang={lang}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* 运行时界面 */}
      <header className="app-header no-print">
        <div 
          className="brand" 
          style={{ position: 'relative', cursor: 'pointer', userSelect: 'none' }}
          onClick={(e) => {
            e.stopPropagation(); // 阻止冒泡到 document
            setIsBrandMenuOpen(!isBrandMenuOpen);
          }}
        >
          <img src="icon.png" className="brand-logo" style={{ width: '24px', height: '24px', objectFit: 'cover', borderRadius: '4px' }} alt="" />
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: '6px' }}>
            SmartHome PLC 
            <span style={{ fontSize: '8px', opacity: 0.5, transition: 'transform 0.2s', transform: isBrandMenuOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
          </h1>

          {/* 左上角品牌高级下拉功能菜单 (Popover Menu) */}
          {isBrandMenuOpen && (
            <div 
              style={{
                position: 'absolute',
                top: '32px',
                left: '0',
                background: '#1e293b',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '6px 0',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                zIndex: 9999,
                width: '180px',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={(e) => e.stopPropagation()} // 防止点击内部项时向上冒泡触发 setIsBrandMenuOpen(false) 导致异常
            >
              <div style={{ padding: '4px 12px', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '4px' }}>
                {t('menuFile')}
              </div>
              <button 
                type="button"
                className="brand-menu-item"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  padding: '8px 16px',
                  fontSize: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  boxSizing: 'border-box',
                  userSelect: 'none'
                }}
                onClick={() => {
                  setIsBrandMenuOpen(false);
                  handleLoadProject();
                }}
              >
                <Icons.FolderOpen size={13} style={{ marginRight: '8px' }} />
                {t('importDoc')}
              </button>
              <button 
                type="button"
                className="brand-menu-item"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  padding: '8px 16px',
                  fontSize: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  boxSizing: 'border-box',
                  userSelect: 'none'
                }}
                onClick={() => {
                  setIsBrandMenuOpen(false);
                  handleExportProject();
                }}
              >
                <Icons.Save size={13} style={{ marginRight: '8px' }} />
                {t('exportDoc')}
              </button>
              <button 
                type="button"
                className="brand-menu-item"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  padding: '8px 16px',
                  fontSize: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  boxSizing: 'border-box',
                  userSelect: 'none'
                }}
                onClick={() => {
                  setIsBrandMenuOpen(false);
                  handleExportPDF();
                }}
              >
                <Icons.FileText size={13} style={{ marginRight: '8px' }} />
                {t('exportPdf')}
              </button>
              <button 
                type="button"
                className="brand-menu-item"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  padding: '8px 16px',
                  fontSize: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  boxSizing: 'border-box',
                  userSelect: 'none'
                }}
                onClick={() => {
                  setIsBrandMenuOpen(false);
                  handleOpenPresetsManager();
                }}
              >
                <Icons.Database size={13} style={{ marginRight: '8px' }} />
                {t('manageDb')}
              </button>

              <div style={{ padding: '6px 12px 4px 12px', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.05)', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '4px', marginBottom: '4px' }}>
                {t('menuLanguage')}
              </div>
              <button 
                type="button"
                className="brand-menu-item"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: lang === 'zh' ? 'var(--color-primary)' : '#fff',
                  padding: '8px 16px',
                  fontSize: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  boxSizing: 'border-box',
                  userSelect: 'none',
                  fontWeight: lang === 'zh' ? 'bold' : 'normal'
                }}
                onClick={() => {
                  setLang('zh');
                  setIsBrandMenuOpen(false);
                }}
              >
                <span style={{ marginRight: '8px' }}>🇨🇳</span> 中文 (Chinese)
              </button>
              <button 
                type="button"
                className="brand-menu-item"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: lang === 'en' ? 'var(--color-primary)' : '#fff',
                  padding: '8px 16px',
                  fontSize: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  boxSizing: 'border-box',
                  userSelect: 'none',
                  fontWeight: lang === 'en' ? 'bold' : 'normal'
                }}
                onClick={() => {
                  setLang('en');
                  setIsBrandMenuOpen(false);
                }}
              >
                <span style={{ marginRight: '8px' }}>🇺🇸</span> English (英文)
              </button>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '6px', paddingTop: '4px' }}>
                <button 
                  type="button"
                  className="brand-menu-item"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#f87171',
                    padding: '8px 16px',
                    fontSize: '12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    boxSizing: 'border-box',
                    userSelect: 'none'
                  }}
                  onClick={() => {
                    setIsBrandMenuOpen(false);
                    if (window.confirm(lang === 'zh' ? '确定要退出关闭软件吗？' : 'Are you sure you want to close the application?')) {
                      window.close();
                    }
                  }}
                >
                  <Icons.LogOut size={13} style={{ marginRight: '8px' }} />
                  {t('closeApp')}
                </button>
              </div>
            </div>
          )}

          <input
            type="text"
            className="project-title-input"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            title={t('projectTitle')}
            onClick={(e) => e.stopPropagation()} // 防止触发弹出菜单
          />
        </div>

        {/* 多方案版本切换与管理栏 */}
        <div className="version-bar" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginLeft: '20px' }}>
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 500 }}>{t('activeVersion')}:</span>
          
          <select
            style={{
              background: '#0f172a',
              border: '1px solid var(--border-color)',
              color: '#fff',
              fontSize: '12px',
              padding: '4px 8px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
              minWidth: '150px'
            }}
            value={activeVersionId}
            onChange={(e) => handleSwitchVersion(e.target.value)}
            title={lang === 'zh' ? '切换当前比对的设计与报价方案' : 'Switch active proposal version'}
          >
            {versions.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>

          <button
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '11px', height: '26px' }}
            onClick={handleRenameVersion}
            title={t('rename')}
          >
            {t('rename')}
          </button>

          <button
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '11px', height: '26px' }}
            onClick={handleDuplicateVersion}
            title={t('copySnapshot')}
          >
            {t('copySnapshot')}
          </button>

          <button
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '11px', height: '26px' }}
            onClick={handleCreateNewVersion}
            title={t('newVersion')}
          >
            {t('newVersion')}
          </button>

          {versions.length > 1 && (
            <button
              className="btn btn-secondary"
              style={{ padding: '4px 6px', fontSize: '11px', height: '26px', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.2)' }}
              onClick={() => handleDeleteVersion(activeVersionId)}
              title={t('deleteVersion')}
            >
              {t('deleteVersion')}
            </button>
          )}
        </div>
        
        <div className="header-actions">
          {bgImage && (
            <button className="btn btn-secondary" onClick={handleSelectBgImage}>
              {lang === 'zh' ? '重新上传底图' : 'Replace Floorplan'}
            </button>
          )}

          <button className="btn btn-secondary" onClick={handleNewProject}>
            <FilePlus size={15} /> {lang === 'zh' ? '新建项目' : 'New Project'}
          </button>

          <button className="btn btn-secondary" onClick={handleLoadProject}>
            <FolderOpen size={15} /> {t('importDoc')}
          </button>

          <button className="btn btn-secondary" onClick={handleSaveProject}>
            <Save size={15} /> {t('exportDoc')}
          </button>

          <button className="btn btn-primary" onClick={handleExportPDF}>
            <FileText size={15} /> {t('exportPdf')}
          </button>
        </div>
      </header>

      <div className="main-workspace no-print">
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          
          {/* 左上角悬浮“产品库”按钮 (可点击，可拖动更改位置) */}
          <button 
            className={`floating-sidebar-trigger ${isSidebarOpen ? 'active' : ''}`}
            onMouseDown={handleTriggerMouseDown}
            title="拖拽可调整位置；点击可展开/收起产品库"
            style={{
              position: 'absolute',
              left: `${triggerPos.x}px`,
              top: `${triggerPos.y}px`,
              zIndex: 1001,
              cursor: 'grab',
            }}
          >
            <LayoutGrid size={15} />
            <span>智能产品库</span>
            {isSidebarOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {/* 悬浮 Sidebar 窗口 (固定在左侧渲染，避开上方 Tab) */}
          {isSidebarOpen && (
            <div 
              className="floating-sidebar"
              style={{
                position: 'absolute',
                left: '16px',
                top: '70px', 
                bottom: '16px',
                width: '280px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Sidebar 
                onAddDevice={handleAddDevice} 
                customPresets={customPresets} 
                onUpdateCustomPresets={setCustomPresets}
                onClose={() => setIsSidebarOpen(false)}
                lang={lang}
              />
            </div>
          )}
          <EditorCanvas
            projectName={projectName}
            bgImage={bgImage}
            devices={devices}
            wires={wires}
            selectedElement={selectedElement}
            canvasMode={canvasMode}
            scale={scale}
            offset={offset}
            onUpdateScale={setScale}
            onUpdateOffset={setOffset}
            onAddDevice={handleAddDevice}
            onUpdateDevice={handleUpdateDevice}
            onAddWire={handleAddWire}
            onUpdateWire={handleUpdateWire}
            onSelectElement={setSelectedElement}
            onFileSelect={handleSelectBgImage}
            onDeleteElement={handleDeleteElement}
            onChangeCanvasMode={setCanvasMode}
            highlightedDeviceId={highlightedDeviceId} // 传递高光定位 ID
            onClearBgImage={handleClearBgImage} // 传递清除底图回调
            onUpdateActiveTabDimensions={handleUpdateActiveTabDimensions} // 传递记录底图物理大小回调
            
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={setActiveTabId}
            onAddTab={handleAddTab}
            onDuplicateTab={handleDuplicateTab}
            onRenameTab={handleRenameTab}
            onDeleteTab={handleDeleteTab}
            lang={lang}
          />

          {/* 右侧面板折叠/展开的控制手把 (盖在 Canvas 上，随动 rightPanelWidth) */}
          <button 
            className={`collapse-handle ${isRightPanelCollapsed ? 'collapsed' : ''}`}
            onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
            style={{ right: isRightPanelCollapsed ? '0px' : `${rightPanelWidth}px` }}
            title={isRightPanelCollapsed ? "展开属性和报价" : "收缩属性和报价"}
          >
            {isRightPanelCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
          
          {/* 右侧面板包装，采用绝对定位悬浮在 Canvas 右侧，绝对不挤压 Canvas 的物理空间，也就绝不影响底图尺寸！ */}
          <div 
            className={`property-panel-wrapper ${isRightPanelCollapsed ? 'collapsed' : ''}`}
            style={{ 
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              zIndex: 100,
              width: isRightPanelCollapsed ? '0px' : `${rightPanelWidth}px` 
            }}
          >
            {!isRightPanelCollapsed && (
              <div 
                className="panel-resizer"
                onMouseDown={handleResizerMouseDown}
                title="按住左右拖动改变面板宽度"
              />
            )}
            <PropertyPanel
              selectedElement={selectedElement}
              devices={allDevices} // 全局加总设备
              wires={wires}
              extraCosts={extraCosts}
              onUpdateDevice={handleUpdateDevice}
              onUpdateWire={handleUpdateWire}
              onDeleteElement={handleDeleteElement}
              onUpdateExtraCosts={handleUpdateExtraCosts}
              
              // 新增报价单内修改数量和删除
              onChangeDeviceCount={handleChangeDeviceCount}
              onDeleteDeviceGroup={handleDeleteDeviceGroup}
              activeTabName={activeTab.name}
              onFocusDeviceModel={handleFocusDeviceModel} // 传递循环定位回调
              lang={lang}
            />
          </div>
        </div>
      </div>

      {/* A4 打印专属排版布局 (白底高对比度印刷标准) */}
      <div className="print-layout">
        {tabs.map((tab, idx) => {
          const tabDevices = tab.devices || [];
          const tabWires = tab.wires || [];
          const bgW = tab.bgWidth || 2000;
          const bgH = tab.bgHeight || 2000;

          return (
            <div className="print-page" key={tab.id}>
              <div className="print-header">
                <h2>智能家居布线图 - {tab.name}</h2>
                <div className="print-header-meta">
                  <div>项目名称：{projectName}</div>
                  <div>导出日期：{new Date().toLocaleDateString('zh-CN')}</div>
                </div>
              </div>

              {/* 平面图与布线覆盖容器 - 采用同一 viewBox SVG 图层叠加设计，确保 100% 高保真打印对齐且无偏斜 */}
              <div className="print-canvas-container" style={{ position: 'relative', width: '100%', height: '180mm', border: '1px solid #cccccc', overflow: 'hidden', background: '#ffffff' }}>
                {tab.bgImage ? (
                  <>
                    <svg 
                      style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: '100%', 
                        height: '100%',
                        zIndex: 2
                      }} 
                  viewBox={`0 0 ${bgW} ${bgH}`}
                  preserveAspectRatio="xMidYMid meet"
                >
                  {/* 平面图底图 (直接作为 SVG 底层元素，保证在同一个物理坐标系中对齐) */}
                  {tab.bgImage && (
                    <image
                      href={tab.bgImage}
                      width={bgW}
                      height={bgH}
                      preserveAspectRatio="xMidYMid meet"
                    />
                  )}

                  {/* 绘制走线 */}
                  {tabWires.map((wire) => {
                    const pointsString = wire.points.map(p => `${p.x},${p.y}`).join(' ');

                    if (wire.type === 'live-neutral') {
                      return (
                        <g key={wire.id}>
                          {/* 火线实线 */}
                          <polyline points={pointsString} fill="none" stroke="#ef4444" strokeWidth={5} />
                          {/* 零线虚线：利用法向角平分线偏移 6px 完美平行 */}
                          <polyline points={getOffsetPoints(wire.points, 6).map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#3b82f6" strokeWidth={5} strokeDasharray="6,6" />
                        </g>
                      );
                    }

                    return (
                      <polyline
                        key={wire.id}
                        points={pointsString}
                        fill="none"
                        stroke={wire.type === 'network' ? '#eab308' : wire.color} // 网线改黄
                        strokeWidth={wire.type === 'knx' || wire.type === 'network' ? 5 : 4}
                        strokeDasharray={wire.type === 'neutral' ? '8,8' : 'none'}
                      />
                    );
                  })}

                  {/* 绘制智能硬件终端 */}
                  {tabDevices.map((dev) => {
                    const devColor = dev.color || '#3b82f6';
                    const scaleFactor = (dev.size || 48) / 48;
                    const radarRotation = dev.fovRotation !== undefined ? dev.fovRotation : (dev.rotation || 0);

                    return (
                      <g key={dev.id} transform={`translate(${dev.x}, ${dev.y})`}>
                        {/* 1. 感应与可视范围阴影图层 (不受设备 currentRotation 影响，支持 fovRotation 独立旋转与双向) */}
                        <g transform={`rotate(${radarRotation}) scale(${scaleFactor})`}>
                          {dev.showFov && (
                            <>
                              {/* 正向雷达伞形 */}
                              <path
                                d={getFovPath(dev.fovRange || 160, dev.fovAngle || 80)}
                                fill={`${dev.fovColor || devColor}1a`}
                                stroke={dev.fovColor || devColor}
                                strokeWidth="1.2"
                                strokeDasharray="4,4"
                              />
                              {/* 镜面反向伞形 */}
                              {dev.showDoubleFov && (
                                <path
                                  d={getFovPath(dev.fovRange || 160, dev.fovAngle || 80)}
                                  transform="rotate(180)"
                                  fill={`${dev.fovColor || devColor}1a`}
                                  stroke={dev.fovColor || devColor}
                                  strokeWidth="1.2"
                                  strokeDasharray="4,4"
                                />
                              )}
                            </>
                          )}

                          {dev.showCircleFov && (
                            <circle
                              cx="0"
                              cy="0"
                              r={dev.circleFovRange || 120}
                              fill={`${dev.fovColor || devColor}15`}
                              stroke={dev.fovColor || devColor}
                              strokeWidth="1.2"
                              strokeDasharray="4,4"
                            />
                          )}
                        </g>

                        {/* 2. 设备图标主体层 */}
                        <g transform={`rotate(${dev.rotation || 0}) scale(${(dev.flipX ? -1 : 1) * scaleFactor}, ${scaleFactor})`}>
                          {dev.customImg ? (
                            <>
                              {/* 打印 PDF 时也垫底渲染圆角白卡片，避免自定义 PNG 图片在 PDF 中失去轮廓 */}
                              <rect
                                x="-26"
                                y="-26"
                                width="52"
                                height="52"
                                fill="none"
                                rx="8"
                                stroke={dev.color || '#3b82f6'}
                                strokeWidth="1.5"
                              />
                              <image href={dev.customImg} x="-24" y="-24" width="48" height="48" />
                            </>
                          ) : (
                            <>
                              <rect x="-24" y="-24" width="48" height="48" fill="#ffffff" stroke={devColor} strokeWidth="3.5" rx="8" />
                              {renderPrintDeviceIcon(dev.icon || 'Cpu', devColor)}
                            </>
                          )}
                        </g>
                      </g>
                    );
                  })}
                </svg>

                    {/* 3. 图纸右下角高对比度设备材料明细图签卡片 */}
                    <div className="print-page-device-legend">
                      <div className="legend-table-title">{lang === 'zh' ? '本层平面图所含产品' : 'Devices on this Floor'}</div>
                      <table className="legend-table">
                        <thead>
                          <tr>
                            <th>{lang === 'zh' ? '产品名称' : 'Product Name'}</th>
                            <th>{lang === 'zh' ? '规格型号' : 'Spec Model'}</th>
                            <th>{lang === 'zh' ? '数量' : 'Qty'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const stats = {};
                            tabDevices.forEach(d => {
                              const key = `${d.type}_${d.model}`;
                              if (!stats[key]) {
                                stats[key] = { 
                                  name: d.name, 
                                  model: d.model, 
                                  icon: d.icon, 
                                  customImg: d.customImg, 
                                  color: d.color, 
                                  count: 0 
                                };
                              }
                              stats[key].count += 1;
                            });
                            const statsArr = Object.values(stats);
                            if (statsArr.length === 0) {
                              return (
                                <tr>
                                  <td colSpan="3" style={{ textAlign: 'center', color: '#666', fontSize: '9px', padding: '4px' }}>
                                    暂未布置智能产品
                                  </td>
                                </tr>
                              );
                            }
                            return statsArr.map((item, i) => (
                              <tr key={i}>
                                <td style={{ textAlign: 'left', paddingLeft: '8px' }}>
                                  {renderTableDeviceIcon(item.icon, item.customImg, item.color)}
                                  <span style={{ verticalAlign: 'middle', display: 'inline-block' }}>{item.name}</span>
                                </td>
                                <td>{item.model}</td>
                                <td style={{ fontWeight: 700 }}>{item.count} 台</td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div style={{ color: '#888', fontSize: '14px', textAlign: 'center', padding: '80px 0' }}>该区域未上传平面图纸</div>
                )}
              </div>

              {/* 打印图例说明栏目 */}
              <div className="print-legend">
                <div className="print-legend-title">图例说明 ({tab.name})：</div>
                <div className="print-legend-items">
                  <div className="print-legend-item">
                    <span style={{ display: 'inline-block', width: '30px', height: '4px', backgroundColor: '#ef4444' }} />
                    <span>红色实线：火线 (L)</span>
                  </div>
                  <div className="print-legend-item">
                    <span style={{ display: 'inline-block', width: '30px', height: '4px', borderTop: '4px dashed #3b82f6' }} />
                    <span>蓝色虚线：零线 (N)</span>
                  </div>
                  <div className="print-legend-item" style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '30px', height: '10px' }}>
                      <span style={{ position: 'absolute', top: 1, left: 0, display: 'inline-block', width: '30px', height: '3px', backgroundColor: '#ef4444' }} />
                      <span style={{ position: 'absolute', top: 5, left: 0, display: 'inline-block', width: '30px', height: '3px', borderTop: '3px dashed #3b82f6' }} />
                    </div>
                    <span style={{ marginLeft: '6px' }}>红蓝并列：零火双绞并行线 (LN)</span>
                  </div>
                  <div className="print-legend-item">
                    <span style={{ display: 'inline-block', width: '30px', height: '4px', backgroundColor: '#10b981' }} />
                    <span>绿色粗线：KNX 控制总线</span>
                  </div>
                  <div className="print-legend-item">
                    <span style={{ display: 'inline-block', width: '30px', height: '4px', backgroundColor: '#eab308' }} />
                    <span>黄色粗线：弱电网线</span>
                  </div>
                </div>
              </div>

              <div className="print-footer">
                <span>智能家居系统设计方案</span>
                <span>第 {idx + 1} 页，共 {tabs.length + 1} 页</span>
              </div>
            </div>
          );
        })}

        <div className="print-page">
          <div className="print-header">
            <h2>智能家居产品配置与汇总报价单</h2>
            <div className="print-header-meta">
              <div>项目名称：{projectName}</div>
              <div>报价日期：{new Date().toLocaleDateString('zh-CN')}</div>
            </div>
          </div>

          <div className="print-bill">
            <h3 className="print-bill-title">全屋设备汇总清单</h3>
            <table className="print-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>产品名称</th>
                  <th style={{ width: '30%' }}>规格型号</th>
                  <th style={{ width: '15%' }}>单价</th>
                  <th style={{ width: '15%' }}>汇总数量</th>
                  <th style={{ width: '15%' }}>小计</th>
                </tr>
              </thead>
              <tbody>
                {deviceStats.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: '#666' }}>全屋标签页中均未放置任何设备</td>
                  </tr>
                ) : (
                  deviceStats.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>{item.model}</td>
                      <td>RM {item.price}</td>
                      <td>{item.count}</td>
                      <td>RM {item.price * item.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="print-total-section">
              <div className="print-total-row">
                <span>设备硬件总合价：</span>
                <span>RM {devicesTotal.toFixed(2)}</span>
              </div>
              <div className="print-total-row">
                <span>现场安装与系统调试费：</span>
                <span>RM {laborCost.toFixed(2)}</span>
              </div>
              {discountPercent > 0 && (
                <div className="print-total-row" style={{ color: '#ef4444' }}>
                  <span>整单专属折让 (减免 {discountPercent}%)：</span>
                  <span>- RM {(devicesTotal * discountPercent / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="print-total-row final">
                <span>全屋项目总计报价：</span>
                <span>RM {finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="print-footer">
            <span>智能家居系统设计方案</span>
            <span>第 {tabs.length + 1} 页，共 {tabs.length + 1} 页</span>
          </div>
        </div>
      </div>

      {/* 自定义文本输入 Prompt 弹窗 */}
      {promptDialog.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.65)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#1e293b',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '20px',
            width: '320px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h4 style={{ margin: 0, color: '#fff', fontSize: '14px', fontWeight: 600 }}>{promptDialog.title}</h4>
            <input
              type="text"
              id="custom-prompt-input"
              style={{
                width: '100%',
                background: '#0f172a',
                border: '1px solid var(--border-color)',
                color: '#fff',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '12.5px',
                boxSizing: 'border-box'
              }}
              defaultValue={promptDialog.defaultValue}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = e.target.value.trim();
                  if (val) {
                    promptDialog.onSubmit(val);
                    setPromptDialog({ show: false, title: '', defaultValue: '', onSubmit: null });
                  }
                }
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 12px', fontSize: '12px', height: '28px' }}
                onClick={() => setPromptDialog({ show: false, title: '', defaultValue: '', onSubmit: null })}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                style={{ padding: '4px 12px', fontSize: '12px', height: '28px' }}
                onClick={() => {
                  const inputEl = document.getElementById('custom-prompt-input');
                  const val = inputEl ? inputEl.value.trim() : '';
                  if (val) {
                    promptDialog.onSubmit(val);
                    setPromptDialog({ show: false, title: '', defaultValue: '', onSubmit: null });
                  }
                }}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 自定义操作 Confirm 确认弹窗 */}
      {confirmDialog.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.65)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#1e293b',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '20px',
            width: '320px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h4 style={{ margin: 0, color: '#fff', fontSize: '14px', fontWeight: 600 }}>{confirmDialog.title}</h4>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '12.5px', lineHeight: 1.5 }}>{confirmDialog.message}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 12px', fontSize: '12px', height: '28px' }}
                onClick={() => setConfirmDialog({ show: false, title: '', message: '', onConfirm: null })}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                style={{ padding: '4px 12px', fontSize: '12px', height: '28px', background: '#ef4444', borderColor: '#ef4444' }}
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog({ show: false, title: '', message: '', onConfirm: null });
                }}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 自定义 Alert 消息提示弹窗 */}
      {alertDialog.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.65)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#1e293b',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '20px',
            width: '360px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h4 style={{ margin: 0, color: '#fff', fontSize: '14px', fontWeight: 600 }}>{alertDialog.title}</h4>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '12.5px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{alertDialog.message}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                className="btn btn-primary"
                style={{ padding: '4px 14px', fontSize: '12px', height: '28px' }}
                onClick={() => setAlertDialog({ show: false, title: '', message: '' })}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
