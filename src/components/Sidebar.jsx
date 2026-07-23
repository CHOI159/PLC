import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';

// 预设的高颜值智能家居产品库
export const PRESET_DEVICES = [
  {
    type: 'gateway',
    name: '智能多模网关',
    model: 'GW-M02',
    price: 399,
    icon: 'Radio',
    category: 'smart-home',
    desc: '智能家居控制大脑，支持Zigbee/ Matter/ 蓝牙双模'
  },
  {
    type: 'switch_1',
    name: '单键智能零火开关',
    model: 'SW-1K',
    price: 129,
    icon: 'ToggleLeft',
    category: 'smart-home',
    desc: '零火线版，支持单路灯具智能控制'
  },
  {
    type: 'switch_2',
    name: '双键智能零火开关',
    model: 'SW-2K',
    price: 149,
    icon: 'ToggleRight',
    category: 'smart-home',
    desc: '零火线版，支持双路灯具智能控制'
  },
  {
    type: 'switch_3',
    name: '三键智能零火开关',
    model: 'SW-3K',
    price: 169,
    icon: 'Sliders',
    category: 'smart-home',
    desc: '零火线版，支持三路灯具智能控制'
  },
  {
    type: 'socket',
    name: '智能墙壁插座',
    model: 'SK-16A',
    price: 99,
    icon: 'Power',
    category: 'smart-home',
    desc: '16A大功率，支持电量统计与定时控制'
  },
  {
    type: 'thermostat',
    name: '智能温控面板',
    model: 'TP-LC01',
    price: 299,
    icon: 'Thermometer',
    category: 'smart-home',
    desc: '空调/地暖/新风三合一高清液晶面板'
  },
  {
    type: 'curtain',
    name: '智能静音窗帘电机',
    model: 'CM-S05',
    price: 499,
    icon: 'Columns',
    category: 'smart-home',
    desc: '超静音电机，支持百分比开合控制'
  },
  {
    type: 'camera_indoor',
    name: '室内云台摄像机',
    model: 'CAM-I02',
    price: 229,
    icon: 'Camera',
    category: 'camera',
    desc: '300万高清夜视，移动侦测自动追踪'
  },
  {
    type: 'camera_outdoor',
    name: '室外防水枪机摄像头',
    model: 'CAM-O03',
    price: 299,
    icon: 'Camera',
    category: 'camera',
    desc: '400万超清防水枪机，智能声光主动防御'
  },
  {
    type: 'sensor_motion',
    name: '人体照度传感器',
    model: 'SN-M01',
    price: 89,
    icon: 'Eye',
    category: 'security',
    desc: '检测人体移动及环境光亮度，联动智能场景'
  },
  {
    type: 'sensor_door',
    name: '门窗状态传感器',
    model: 'SN-D01',
    price: 59,
    icon: 'DoorClosed',
    category: 'security',
    desc: '门窗开合实时检测，安防守卫首选'
  },
  {
    type: 'light_ceiling',
    name: '智能防眩吸顶灯',
    model: 'LT-CL40',
    price: 199,
    icon: 'Sun',
    category: 'smart-home',
    desc: '支持无极色温/亮度调节，健康护眼'
  }
];

export default function Sidebar({ 
  onAddDevice, 
  customPresets = [], 
  onUpdateCustomPresets,
  onClose,
  lang = 'zh'
}) {
  const TRANSLATIONS = {
    zh: {
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
      deviceName: "设备名称",
      deviceModel: "规格型号",
      devicePrice: "预算单价",
      categoryListLabel: "产品可视化图标排序",
      categorySmartHome: "智能家居",
      categoryCamera: "摄像监控",
      categorySecurity: "安全防护",
      categoryAdd: "+ 新建产品分类...",
      categoryAddInput: "输入新分类中文名称 *",
      imgChooseBtn: "选择文件",
      imgNoFile: "未选择任何文件",
      descLabel: "智能设备描述",
      descPlaceholder: "如：描述智能产品的功能特点",
      addSuccess: "产品已成功保存并录入产品库！",
      productLibraryTitle: "智能产品库",
      noPresetInCat: "暂无产品"
    },
    en: {
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
      deviceName: "Device Name",
      deviceModel: "Spec Model",
      devicePrice: "Price",
      categoryListLabel: "Product Icons Sorting",
      categorySmartHome: "Smart Home",
      categoryCamera: "Camera & CCTV",
      categorySecurity: "Home Security",
      categoryAdd: "+ New Category...",
      categoryAddInput: "Enter new category name *",
      imgChooseBtn: "Choose File",
      imgNoFile: "No file chosen",
      descLabel: "Device Description",
      descPlaceholder: "e.g., descriptions of smart device functions",
      addSuccess: "Product successfully saved to library!",
      productLibraryTitle: "Smart Products",
      noPresetInCat: "No devices"
    }
  };

  const t = (key) => {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['zh']?.[key] || key;
  };

  const getCategoryLabel = (cat) => {
    if (cat === 'smart-home') return t('categorySmartHome');
    if (cat === 'camera') return t('categoryCamera');
    if (cat === 'security') return t('categorySecurity');
    return cat;
  };

  // 强防御校验，确保 customPresets 是数组，防止 null 导致 react 挂掉
  const activePresets = Array.isArray(customPresets) ? customPresets : PRESET_DEVICES;

  const isPresetsManagerMode = window.electronAPI && typeof window.electronAPI.getMode === 'function'
    ? window.electronAPI.getMode() === 'presets-manager'
    : false;

  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, targetPresetType) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const sourceIndex = draggedIndex;
    const targetIndex = activePresets.findIndex(p => p.type === targetPresetType);

    if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return;

    // 强防御越界校验：检查元素有效性，阻断删除后未同步重置引起的 React 未捕获崩溃
    const sourcePreset = activePresets[sourceIndex];
    const targetPreset = activePresets[targetIndex];
    if (!sourcePreset || !targetPreset) return;

    // 限制：只能在同一个分类内拖拽排序
    if (sourcePreset.category !== targetPreset.category) return;

    const updated = [...activePresets];
    updated.splice(sourceIndex, 1);
    updated.splice(targetIndex, 0, sourcePreset);

    setDraggedIndex(targetIndex);
    onUpdateCustomPresets(updated);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const [showModal, setShowModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [pendingMergeItems, setPendingMergeItems] = useState([]);

  // 产品库浮动弹窗拖拽位置状态
  const [modalPos, setModalPos] = useState({ x: 100, y: 100 });
  // 产品库悬浮弹窗大小状态 (默认 820px 宽，580px 高)
  const [modalSize, setModalSize] = useState({ w: 820, h: 580 });

  // 弹窗显示时，自动在屏幕居中并重置大小
  useEffect(() => {
    if (showModal) {
      const initialX = Math.max(20, (window.innerWidth - 820) / 2);
      const initialY = Math.max(20, (window.innerHeight - 580) / 2);
      setModalPos({ x: initialX, y: initialY });
      setModalSize({ w: 820, h: 580 });
    }
  }, [showModal]);

  // 处理产品库弹窗 Header 拖拽
  const handleHeaderMouseDown = (e) => {
    if (
      e.target.tagName === 'BUTTON' || 
      e.target.closest('button') || 
      e.target.tagName === 'INPUT' || 
      e.target.tagName === 'SELECT'
    ) {
      return;
    }
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = { ...modalPos };

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      // 限制拖动范围，确保 Header 不出视口
      const newX = Math.max(10, Math.min(window.innerWidth - 300, startPos.x + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 80, startPos.y + dy));

      setModalPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 处理产品库悬浮窗右下角拉伸大小
  const handleResizeMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = modalSize.w;
    const startH = modalSize.h;

    const handleMouseMove = (moveEvent) => {
      const dw = moveEvent.clientX - startX;
      const dh = moveEvent.clientY - startY;

      // 限制拉伸的最小尺寸为 500x400，最大不要溢出当前浏览器窗口
      const newW = Math.max(500, Math.min(window.innerWidth - 40, startW + dw));
      const newH = Math.max(400, Math.min(window.innerHeight - 40, startH + dh));

      setModalSize({ w: newW, h: newH });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 动态无限分类收纳展开字典状态 (默认均展开)
  const [expandedCategories, setExpandedCategories] = useState({});

  // 动态分类可选列表
  const [categoriesList, setCategoriesList] = useState(() => {
    const catSet = new Set(['smart-home', 'camera', 'security']);
    activePresets.forEach(p => {
      if (p && p.category) catSet.add(p.category);
    });
    return Array.from(catSet);
  });

  // 动态热同步：仅当预设数据库 (activePresets) 长度改变 (如添加或删除产品) 时，才触发分类列表重算
  // 这样可以彻底避免用户在右侧表单里输入产品名称/规格型号等局部字段时，由于触发大重绘而导致键盘失去焦点 (Focus) 的重大 Bug
  useEffect(() => {
    const catSet = new Set(['smart-home', 'camera', 'security']);
    activePresets.forEach(p => {
      if (p && p.category) catSet.add(p.category);
    });
    const currentCats = Array.from(catSet);
    
    setCategoriesList(prev => {
      const merged = [...prev];
      currentCats.forEach(c => {
        if (!merged.includes(c)) {
          merged.push(c);
        }
      });
      const filtered = merged.filter(c => 
        c === 'smart-home' || c === 'camera' || c === 'security' || currentCats.includes(c)
      );

      // 如果当前表单选中的分类被过滤消失了，重置回默认的 smart-home
      if (category && category !== 'smart-home' && category !== 'camera' && category !== 'security' && !filtered.includes(category)) {
        setCategory('smart-home');
      }
      return filtered;
    });
  }, [activePresets.length]);

  // 当在表单选择分类下拉菜单时触发
  const handleCategoryChange = (val) => {
    setCategory(val);
    if (val === '+add-new-category') {
      setNewCategoryName('');
    }
  };

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => ({
      ...prev,
      [cat]: prev[cat] !== undefined ? !prev[cat] : false
    }));
  };
  
  // 表单状态
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [price, setPrice] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Camera');
  const [category, setCategory] = useState('smart-home');
  const [customImgBase64, setCustomImgBase64] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  // 气泡图标选择器状态：记录当前正在修改图标的预设产品 type 标识，为 null 则不展开
  const [editingIconPresetType, setEditingIconPresetType] = useState(null);

  // 动态渲染 Lucide 图标的辅助函数
  const renderIcon = (iconName, customSize) => {
    const IconComponent = Icons[iconName] || Icons.Cpu;
    const size = customSize || (isPresetsManagerMode ? 36 : 20);
    return <IconComponent size={size} />;
  };

  // 本地图片导入与等比高保真压缩 (防 localStorage 满)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const maxW = 128;
        const maxH = 128;
        let w = img.width;
        let h = img.height;

        if (w > maxW || h > maxH) {
          if (w > h) {
            h = Math.round((h * maxW) / w);
            w = maxW;
          } else {
            w = Math.round((w * maxH) / h);
            h = maxH;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        
        const base64Data = canvas.toDataURL('image/png');
        setCustomImgBase64(base64Data);
      };
    };
    reader.readAsDataURL(file);
  };

  // 保存自定义产品到预设库
  const handleSavePreset = (e) => {
    e.preventDefault();
    if (!name.trim() || !model.trim()) {
      alert('请完整填写产品名称与规格型号！');
      return;
    }

    let finalCategory = category;
    if (category === '+add-new-category') {
      if (!newCategoryName.trim()) {
        alert('请输入新分类的名称！');
        return;
      }
      const cleanCat = newCategoryName.trim();
      finalCategory = cleanCat;
      
      // 添加到可用分类列表中
      if (!categoriesList.includes(cleanCat)) {
        setCategoriesList(prev => [...prev, cleanCat]);
      }
    }

    const newPreset = {
      type: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      model: model.trim(),
      price: parseFloat(price) || 0,
      icon: selectedIcon,
      category: finalCategory, // 新建产品关联分类
      customImg: customImgBase64, // base64 大小已被缩至 128px 内
      isCustom: true
    };

    onUpdateCustomPresets([...activePresets, newPreset]);
    
    // 重置状态
    setName('');
    setModel('');
    setPrice('');
    setSelectedIcon('Camera');
    setCategory('smart-home');
    setNewCategoryName('');
    setCustomImgBase64('');
    setShowModal(false);
  };

  // 分类重排序逻辑：上移/下移分类区块并重整 activePresets
  const handleMoveCategory = (cat, direction) => {
    const currentIndex = categoriesList.indexOf(cat);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= categoriesList.length) return;

    const newCategoriesList = [...categoriesList];
    const temp = newCategoriesList[currentIndex];
    newCategoriesList[currentIndex] = newCategoriesList[targetIndex];
    newCategoriesList[targetIndex] = temp;

    // 更新分类状态
    setCategoriesList(newCategoriesList);

    // 重新根据排序后的 categoriesList 物理重排 activePresets 预设列表的物理顺序
    const sortedPresets = [];
    newCategoriesList.forEach(c => {
      const devices = activePresets.filter(p => (p.category || 'smart-home') === c);
      sortedPresets.push(...devices);
    });

    // 考虑那些不包含在 categoriesList 中的预设（兜底）
    const others = activePresets.filter(p => !newCategoriesList.includes(p.category || 'smart-home'));
    sortedPresets.push(...others);

    onUpdateCustomPresets(sortedPresets);
  };

  // 删除自定义预设
  const handleDeletePreset = (e, type) => {
    e.stopPropagation();
    setDraggedIndex(null); // 在删除产品预设前强制清空拖动中的索引焦点，阻断越界冲突与崩溃
    if (window.confirm('确定要从产品库中永久删除此产品预设吗？')) {
      onUpdateCustomPresets(activePresets.filter(p => p.type !== type));
    }
  };

  // 行级编辑：直接修改产品的某一个特定属性 (如价格、名称、型号、分类等)
  const handleUpdatePresetField = (type, field, val) => {
    const updated = activePresets.map(p => 
      p.type === type ? { ...p, [field]: val } : p
    );
    onUpdateCustomPresets(updated);
  };



  // 导出自定义产品库
  const handleExportPresets = async () => {
    if (window.electronAPI) {
      const res = await window.electronAPI.savePresets(activePresets);
      if (res.success) {
        alert(`产品库已成功导出至：\n${res.filePath}`);
      } else if (!res.cancelled && res.error) {
        alert(`导出产品库失败：${res.error}`);
      }
    } else {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activePresets, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `custom_presets.plcpresets`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  };

  // 检查导入的产品数据，生成对比列表并弹出合并模态框
  const processImportPresets = (importedData) => {
    if (!Array.isArray(importedData)) {
      alert('导入失败：产品数据格式不正确！');
      return;
    }

    const items = importedData.map(importP => {
      if (!importP || !importP.name || !importP.model) {
        return null;
      }
      
      const importName = String(importP.name || '').trim().toLowerCase();
      const importModel = String(importP.model || '').trim().toLowerCase();

      // 1. 判断是否精确重复 (根据 type 相同，或者 name 和 model 完全一致)
      const exactMatch = activePresets.find(localP => {
        const typeMatch = localP.type === importP.type;
        const nameModelMatch = 
          String(localP.name || '').trim().toLowerCase() === importName && 
          String(localP.model || '').trim().toLowerCase() === importModel;
        return typeMatch || nameModelMatch;
      });

      if (exactMatch) {
        return {
          importPreset: importP,
          status: 'conflict', // 完全冲突
          selectedAction: 'skip', // 默认跳过
          localMatch: exactMatch,
          checked: true
        };
      }

      // 2. 判断是否相似 (仅 model 相同且 name 不同，或者仅 name 相同且 model 不同)
      const similarMatch = activePresets.find(localP => {
        const modelMatch = String(localP.model || '').trim().toLowerCase() === importModel;
        const nameMatch = String(localP.name || '').trim().toLowerCase() === importName;
        return (modelMatch && !nameMatch) || (!modelMatch && nameMatch);
      });

      if (similarMatch) {
        return {
          importPreset: importP,
          status: 'similar', // 相似
          selectedAction: 'skip', // 默认跳过
          localMatch: similarMatch,
          checked: true
        };
      }

      // 3. 全新产品
      return {
        importPreset: importP,
        status: 'new', // 全新
        selectedAction: 'add', // 默认直接导入
        localMatch: null,
        checked: true
      };
    }).filter(Boolean);

    if (items.length === 0) {
      alert('未在文件中发现有效的产品预设数据。');
      return;
    }

    setPendingMergeItems(items);
    setShowMergeModal(true);
  };

  // 确认合并
  const handleConfirmMerge = () => {
    let mergedPresets = [...activePresets];

    pendingMergeItems.forEach(item => {
      // 若未勾选，不导入该产品
      if (!item.checked) return;

      const { importPreset, selectedAction, localMatch } = item;

      if (selectedAction === 'add') {
        let finalType = importPreset.type;
        // 保证 type 的唯一性
        if (mergedPresets.some(p => p.type === finalType)) {
          finalType = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        }
        mergedPresets.push({
          ...importPreset,
          type: finalType,
          isCustom: true
        });
      } else if (selectedAction === 'overwrite') {
        if (localMatch) {
          mergedPresets = mergedPresets.map(localP => {
            const isMatch = localP.type === localMatch.type || 
              ((localP.name || '').trim().toLowerCase() === (localMatch.name || '').trim().toLowerCase() && 
               (localP.model || '').trim().toLowerCase() === (localMatch.model || '').trim().toLowerCase());
            
            if (isMatch) {
              // 覆盖本地数据，但必须保留本地产品的原有 type
              return {
                ...importPreset,
                type: localP.type, 
                isCustom: true
              };
            }
            return localP;
          });
        }
      } else if (selectedAction === 'keep_both') {
        const suffix = `_导入`;
        const newPreset = {
          ...importPreset,
          type: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: `${importPreset.name}${suffix}`,
          isCustom: true
        };
        mergedPresets.push(newPreset);
      }
    });

    onUpdateCustomPresets(mergedPresets);
    setShowMergeModal(false);
    setPendingMergeItems([]);
    alert('产品库合并导入成功！');
  };

  // 渲染合并导入冲突处理模态窗口
  const renderMergeImportModal = () => {
    if (!showMergeModal) return null;

    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2200,
          backdropFilter: 'blur(4px)'
        }}
        onClick={() => {
          setShowMergeModal(false);
          setPendingMergeItems([]);
        }}
      >
        <div 
          style={{
            width: '680px',
            maxHeight: '80vh',
            background: '#0f172a',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.FolderInput size={18} style={{ color: '#3b82f6' }} />
              产品库合并导入冲突检测
            </h3>
            <button 
              type="button" 
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px'
              }}
              onClick={() => {
                setShowMergeModal(false);
                setPendingMergeItems([]);
              }}
            >
              <Icons.X size={16} />
            </button>
          </div>

          {/* Body List */}
          <div 
            className="custom-presets-scrollbar"
            style={{
              padding: '20px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              系统已检测到以下待导入的产品，请勾选并选择应对策略：
            </div>

            {pendingMergeItems.map((item, index) => {
              const { importPreset, status, selectedAction, localMatch, checked } = item;
              
              // 状态标志
              let badgeColor = '#10b981'; // 绿
              let badgeText = '新产品';
              if (status === 'conflict') {
                badgeColor = '#ef4444'; // 红
                badgeText = '完全重复';
              } else if (status === 'similar') {
                badgeColor = '#f59e0b'; // 黄
                badgeText = '相似预警';
              }

              return (
                <div 
                  key={index}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${checked ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                    borderRadius: '8px',
                    padding: '12px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    transition: 'border-color 0.2s',
                    opacity: checked ? 1 : 0.6
                  }}
                >
                  {/* Top line */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input 
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const updated = [...pendingMergeItems];
                          updated[index].checked = e.target.checked;
                          setPendingMergeItems(updated);
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                        {importPreset.name}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        (型号: {importPreset.model})
                      </span>
                    </div>

                    <span style={{
                      fontSize: '10.5px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: `${badgeColor}22`,
                      color: badgeColor,
                      border: `1px solid ${badgeColor}44`,
                      fontWeight: 600
                    }}>
                      {badgeText}
                    </span>
                  </div>

                  {/* Conflict/Similar detail */}
                  {(status === 'conflict' || status === 'similar') && localMatch && (
                    <div style={{
                      fontSize: '11.5px',
                      padding: '6px 10px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: '4px',
                      color: 'var(--text-muted)',
                      borderLeft: `3px solid ${badgeColor}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}>
                      <div>
                        本地已有相同型号或名称的产品：
                        <strong style={{ color: 'var(--text-main)' }}> {localMatch.name} </strong>
                        (型号: <span style={{ color: 'var(--text-main)' }}>{localMatch.model}</span>)
                      </div>
                      <div style={{ fontSize: '10.5px', opacity: 0.8 }}>
                        {status === 'conflict' ? '⚠️ 完全重复可能导致覆盖，推荐“覆盖本地”或“跳过”。' : '⚠️ 部分特征重合，请确认是否为同一产品。'}
                      </div>
                    </div>
                  )}

                  {/* Actions Selector */}
                  {checked && (status === 'conflict' || status === 'similar') && (
                    <div style={{
                      display: 'flex',
                      gap: '16px',
                      fontSize: '11.5px',
                      marginTop: '4px',
                      alignItems: 'center'
                    }}>
                      <span style={{ color: 'var(--text-muted)' }}>处理动作：</span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: selectedAction === 'overwrite' ? '#3b82f6' : 'var(--text-muted)' }}>
                        <input 
                          type="radio" 
                          name={`action_${index}`} 
                          value="overwrite"
                          checked={selectedAction === 'overwrite'}
                          onChange={() => {
                            const updated = [...pendingMergeItems];
                            updated[index].selectedAction = 'overwrite';
                            setPendingMergeItems(updated);
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                        覆盖本地
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: selectedAction === 'skip' ? '#3b82f6' : 'var(--text-muted)' }}>
                        <input 
                          type="radio" 
                          name={`action_${index}`} 
                          value="skip"
                          checked={selectedAction === 'skip'}
                          onChange={() => {
                            const updated = [...pendingMergeItems];
                            updated[index].selectedAction = 'skip';
                            setPendingMergeItems(updated);
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                        跳过(不导入)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: selectedAction === 'keep_both' ? '#3b82f6' : 'var(--text-muted)' }}>
                        <input 
                          type="radio" 
                          name={`action_${index}`} 
                          value="keep_both"
                          checked={selectedAction === 'keep_both'}
                          onChange={() => {
                            const updated = [...pendingMergeItems];
                            updated[index].selectedAction = 'keep_both';
                            setPendingMergeItems(updated);
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                        双存(重命名追加)
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px'
          }}>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => {
                setShowMergeModal(false);
                setPendingMergeItems([]);
              }}
              style={{ padding: '6px 14px', fontSize: '12px' }}
            >
              取消
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={handleConfirmMerge}
              style={{ 
                padding: '6px 16px', 
                fontSize: '12px',
                background: '#3b82f6',
                borderColor: '#2563eb',
                color: '#fff',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              确认合并
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 导入自定义产品库 (取代现有库)
  const handleImportPresets = async () => {
    if (window.electronAPI) {
      const res = await window.electronAPI.loadPresets();
      if (res.success && res.presetsData) {
        if (Array.isArray(res.presetsData)) {
          processImportPresets(res.presetsData);
        } else {
          alert('导入失败：文件格式不正确！');
        }
      } else if (!res.cancelled && res.error) {
        alert(`载入产品库失败：${res.error}`);
      }
    } else {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.plcpresets, .json';
      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result);
            if (Array.isArray(data)) {
              processImportPresets(data);
            } else {
              alert('导入失败：文件格式不正确！');
            }
          } catch (err) {
            alert('文件解析失败，请导入正确的产品库文件。');
          }
        };
        reader.readAsText(file);
      };
      fileInput.click();
    }
  };

  // 产品库现已统一使用 activePresets 驱动 (合并了系统默认和自定义产品)
  const allPresets = activePresets;

  // 快捷可选的 Lucide 兜底分类图标
  const availableIcons = ['Camera', 'Radio', 'Power', 'Cpu', 'Lightbulb', 'Shield', 'Sensor', 'Tv'];

  const renderGridLibrary = () => (
    <div style={{ flex: 1.4, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '10px' }}>
        {t('categoryListLabel')} ({activePresets.length} {lang === 'zh' ? '个' : 'items'})
      </label>
      
      {activePresets.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px solid var(--border-color)', flex: 1 }}>
          {lang === 'zh' ? '当下暂无产品预设，您可以在右侧添加新产品。' : 'No presets found. You can add new products on the right.'}
        </div>
      ) : (
        <div 
          className="custom-presets-scrollbar" 
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            background: 'rgba(0,0,0,0.15)', 
            borderRadius: '10px', 
            border: '1px solid var(--border-color)', 
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }} 
          onWheel={(e) => e.stopPropagation()}
        >
          {categoriesList.map(cat => {
            const devicesInCat = activePresets.filter(p => (p.category || 'smart-home') === cat);
            if (devicesInCat.length === 0) return null;

            const CATEGORY_MAP = {
              'smart-home': { label: t('categorySmartHome'), icon: 'Home', color: 'var(--color-primary)' },
              'camera': { label: t('categoryCamera'), icon: 'Camera', color: '#a855f7' },
              'security': { label: t('categorySecurity'), icon: 'Shield', color: '#ef4444' }
            };
            const catMeta = CATEGORY_MAP[cat] || { label: cat, icon: 'Cpu', color: '#f59e0b' };
            const CatIcon = Icons[catMeta.icon] || Icons.Cpu;

            return (
              <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: catMeta.color }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CatIcon size={12} />
                    <span>{catMeta.label} ({devicesInCat.length})</span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleMoveCategory(cat, 'up')}
                      disabled={categoriesList.indexOf(cat) === 0}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: 'none',
                        color: categoriesList.indexOf(cat) === 0 ? '#555' : '#aaa',
                        cursor: categoriesList.indexOf(cat) === 0 ? 'not-allowed' : 'pointer',
                        padding: '2px 5px',
                        fontSize: '9px',
                        borderRadius: '3px'
                      }}
                      title="上移整个分类区块"
                    >
                      ▲ 上移
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveCategory(cat, 'down')}
                      disabled={categoriesList.indexOf(cat) === categoriesList.length - 1}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: 'none',
                        color: categoriesList.indexOf(cat) === categoriesList.length - 1 ? '#555' : '#aaa',
                        cursor: categoriesList.indexOf(cat) === categoriesList.length - 1 ? 'not-allowed' : 'pointer',
                        padding: '2px 5px',
                        fontSize: '9px',
                        borderRadius: '3px'
                      }}
                      title="下移整个分类区块"
                    >
                      ▼ 下移
                    </button>
                  </div>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: `repeat(auto-fill, minmax(${isPresetsManagerMode ? '180px' : '130px'}, 1fr))`, 
                  gap: isPresetsManagerMode ? '14px' : '10px' 
                }}>
                  {devicesInCat.map(preset => {
                    const originalIndex = activePresets.findIndex(p => p.type === preset.type);
                    const isCurrentlyDragging = draggedIndex === originalIndex;

                    return (
                      <div
                        key={preset.type}
                        draggable
                        onDragStart={(e) => handleDragStart(e, originalIndex)}
                        onDragOver={(e) => handleDragOver(e, preset.type)}
                        onDragEnd={handleDragEnd}
                        className="preset-grid-card"
                        style={{
                          background: '#1e293b',
                          border: isCurrentlyDragging ? '2px dashed var(--color-primary)' : '1px solid rgba(255,255,255,0.08)',
                          borderRadius: isPresetsManagerMode ? '12px' : '8px',
                          padding: isPresetsManagerMode ? '14px' : '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          cursor: 'grab',
                          position: 'relative',
                          opacity: isCurrentlyDragging ? 0.4 : 1,
                          transition: 'transform 0.1s, border-color 0.1s, opacity 0.1s',
                          gap: isPresetsManagerMode ? '10px' : '5px' // 使用 flex gap 统一控制子元素纵向间距，防止穿模贴边
                        }}
                      >
                        <div 
                          style={{ 
                            width: isPresetsManagerMode ? '64px' : '48px', 
                            height: isPresetsManagerMode ? '64px' : '48px', 
                            background: 'rgba(0,0,0,0.25)', 
                            borderRadius: '8px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            overflow: 'hidden',
                            cursor: 'pointer',
                            border: '1px dashed rgba(255,255,255,0.15)',
                            position: 'relative'
                          }}
                          title="点击更换产品图标或上传 PNG 图片"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingIconPresetType(editingIconPresetType === preset.type ? null : preset.type);
                          }}
                        >
                          {preset.customImg ? (
                            <img src={preset.customImg} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="" />
                          ) : (
                            renderIcon(preset.icon || 'Cpu')
                          )}
                        </div>

                        {/* 图标/PNG 图片修改悬浮气泡框 */}
                        {editingIconPresetType === preset.type && (
                          <div 
                            style={{
                              position: 'absolute',
                              top: isPresetsManagerMode ? '84px' : '62px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              background: '#1e293b',
                              border: '1px solid var(--border-color)',
                              borderRadius: '10px',
                              padding: '8px',
                              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                              zIndex: 100,
                              width: '160px',
                              display: 'grid',
                              gridTemplateColumns: 'repeat(4, 1fr)',
                              gap: '6px'
                            }}
                            onClick={(e) => e.stopPropagation()} // 阻止向卡片的事件传递
                          >
                            {['Cpu', 'Camera', 'Radio', 'Tv', 'Smartphone', 'Wifi', 'Lightbulb', 'Shield', 'Bell', 'Thermometer', 'Sun', 'Wind'].map(ico => {
                              const IconComp = Icons[ico] || Icons.Cpu;
                              return (
                                <button
                                  key={ico}
                                  type="button"
                                  style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    color: '#fff',
                                    borderRadius: '6px',
                                    padding: '5px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '28px'
                                  }}
                                  onClick={() => {
                                    handleUpdatePresetField(preset.type, 'icon', ico);
                                    handleUpdatePresetField(preset.type, 'customImg', ''); // 清空自定义PNG
                                    setEditingIconPresetType(null);
                                  }}
                                  title={ico}
                                >
                                  <IconComp size={14} />
                                </button>
                              );
                            })}
                            
                            <label
                              style={{
                                gridColumn: 'span 4',
                                background: 'var(--color-primary)',
                                color: '#fff',
                                borderRadius: '6px',
                                padding: '5px 0',
                                fontSize: '11px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                marginTop: '4px',
                                display: 'block',
                                fontWeight: 600,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                              }}
                            >
                              更换 PNG 图片...
                              <input
                                type="file"
                                accept="image/png, image/jpeg"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      handleUpdatePresetField(preset.type, 'customImg', event.target.result);
                                      setEditingIconPresetType(null);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                            
                            <button
                              type="button"
                              style={{
                                gridColumn: 'span 4',
                                background: 'rgba(255,255,255,0.05)',
                                border: 'none',
                                color: 'var(--text-muted)',
                                borderRadius: '6px',
                                padding: '4px 0',
                                fontSize: '10.5px',
                                cursor: 'pointer',
                                marginTop: '2px'
                              }}
                              onClick={() => setEditingIconPresetType(null)}
                            >
                              取消
                            </button>
                          </div>
                        )}

                        <input
                          type="text"
                          style={{ 
                            width: '100%', 
                            padding: isPresetsManagerMode ? '4px 8px' : '2px 4px', 
                            fontSize: isPresetsManagerMode ? '13px' : '11px', 
                            background: 'rgba(0,0,0,0.2)', 
                            border: '1px solid rgba(255,255,255,0.08)', 
                            color: '#fff', 
                            borderRadius: '6px',
                            textAlign: 'center',
                            height: isPresetsManagerMode ? '30px' : 'auto'
                          }}
                          value={preset.name}
                          onChange={(e) => handleUpdatePresetField(preset.type, 'name', e.target.value)}
                          title="点击可直接修改产品名称"
                        />

                        <input
                          type="text"
                          style={{ 
                            width: '100%', 
                            padding: isPresetsManagerMode ? '2px 6px' : '1px 4px', 
                            fontSize: isPresetsManagerMode ? '11px' : '9.5px', 
                            background: 'transparent', 
                            border: 'none', 
                            borderBottom: '1px dashed rgba(255,255,255,0.1)',
                            color: 'var(--text-muted)', 
                            textAlign: 'center',
                            height: isPresetsManagerMode ? '24px' : 'auto'
                          }}
                          value={preset.model}
                          onChange={(e) => handleUpdatePresetField(preset.type, 'model', e.target.value)}
                          title="点击可直接修改规格型号"
                        />

                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: isPresetsManagerMode ? '6px' : '3px', 
                          width: '100%'
                        }}>
                          <span style={{ fontSize: isPresetsManagerMode ? '12px' : '9px', color: 'var(--text-muted)', fontWeight: 'bold' }}>RM</span>
                          <input
                            type="number"
                            style={{ 
                              flex: 1, 
                              width: '100%',
                              minWidth: '0', // 解决 flexbox 子元素默认最小宽度导致的横向溢出穿模
                              padding: isPresetsManagerMode ? '4px 8px' : '1px 3px', 
                              fontSize: isPresetsManagerMode ? '13px' : '10px', 
                              background: 'rgba(0,0,0,0.2)', 
                              border: '1px solid rgba(255,255,255,0.08)', 
                              color: '#60a5fa', 
                              fontWeight: 600,
                              borderRadius: '6px', 
                              textAlign: 'right',
                              height: isPresetsManagerMode ? '30px' : 'auto'
                            }}
                            value={preset.price}
                            onChange={(e) => handleUpdatePresetField(preset.type, 'price', parseFloat(e.target.value) || 0)}
                            title="修改预算单价"
                          />
                        </div>

                        <div style={{ display: 'flex', gap: isPresetsManagerMode ? '6px' : '3px', width: '100%', alignItems: 'center' }}>
                          <select
                            style={{ 
                              flex: 1, 
                              width: '100%',
                              minWidth: '0', // 解决 flexbox 下 select 容器溢出问题
                              padding: isPresetsManagerMode ? '4px 6px' : '2px', 
                              fontSize: isPresetsManagerMode ? '12px' : '9px', 
                              background: 'rgba(0,0,0,0.3)', 
                              border: '1px solid rgba(255,255,255,0.08)', 
                              color: 'var(--text-muted)', 
                              borderRadius: '6px', 
                              cursor: 'pointer',
                              height: isPresetsManagerMode ? '30px' : 'auto'
                            }}
                            value={preset.category || 'smart-home'}
                            onChange={(e) => handleUpdatePresetField(preset.type, 'category', e.target.value)}
                          >
                            <option value="smart-home">智能家居</option>
                            <option value="camera">摄像监控</option>
                            <option value="security">安全防护</option>
                            {categoriesList.filter(c => c !== 'smart-home' && c !== 'camera' && c !== 'security').map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>

                          <button
                            type="button"
                            style={{ 
                              width: isPresetsManagerMode ? '30px' : 'auto',
                              height: isPresetsManagerMode ? '30px' : 'auto',
                              padding: isPresetsManagerMode ? '6px' : '3px', 
                              background: 'rgba(239, 68, 68, 0.1)', 
                              border: 'none', 
                              cursor: 'pointer', 
                              color: '#f87171',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            onClick={(e) => handleDeletePreset(e, preset.type)}
                            title="从产品库中永久删除此产品"
                          >
                            <Icons.Trash2 size={isPresetsManagerMode ? 14 : 10} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderAddForm = () => (
    <div style={{ flex: 0.6, borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '24px', height: '100%', overflowY: 'auto' }} onWheel={(e) => e.stopPropagation()}>
      <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '10px' }}>
        {t('addPresetTitle')}
      </label>
      
      <form onSubmit={handleSavePreset} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('presetName')} *</label>
          <input
            type="text"
            className="form-control"
            style={{ fontSize: '12px', padding: '5px 8px' }}
            placeholder={lang === 'zh' ? '如：双目广角高清摄像头' : 'e.g., Dual-Lens HD Camera'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('presetModel')} *</label>
          <input
            type="text"
            className="form-control"
            style={{ fontSize: '12px', padding: '5px 8px' }}
            placeholder={lang === 'zh' ? '如：CAM-D20-PRO' : 'e.g., CAM-D20-PRO'}
            value={model}
            onChange={(e) => setModel(e.target.value)}
            required
          />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('presetPrice')}</label>
          <input
            type="number"
            className="form-control"
            style={{ fontSize: '12px', padding: '5px 8px' }}
            placeholder={lang === 'zh' ? '如：599' : 'e.g., 599'}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('presetCategory')} *</label>
          <select
            className="form-control"
            style={{ fontSize: '12px', padding: '5px 8px', width: '100%', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '6px', cursor: 'pointer' }}
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            required
          >
            <option value="smart-home">{t('categorySmartHome')}</option>
            <option value="camera">{t('categoryCamera')}</option>
            <option value="security">{t('categorySecurity')}</option>
            {categoriesList.filter(c => c !== 'smart-home' && c !== 'camera' && c !== 'security').map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value="+add-new-category" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{t('categoryAdd')}</option>
          </select>
        </div>

        {category === '+add-new-category' && (
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600 }}>{t('categoryAddInput')}</label>
            <input
              type="text"
              className="form-control"
              style={{ fontSize: '12px', padding: '5px 8px', borderColor: 'var(--color-primary)' }}
              placeholder={lang === 'zh' ? '如：智能照明、影音娱乐' : 'e.g., Smart Lighting, Audio-Visual'}
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              required
            />
          </div>
        )}

        {/* 上传产品真实抠图 */}
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            {t('presetImg')}
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="file"
              accept="image/*"
              style={{ fontSize: '11px', flex: 1 }}
              onChange={handleImageUpload}
            />
            {customImgBase64 && (
              <div style={{ width: '30px', height: '30px', border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden', padding: '2px', background: 'rgba(0,0,0,0.2)' }}>
                <img src={customImgBase64} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Preview" />
              </div>
            )}
          </div>
        </div>

        {/* 兜底 Lucide 分类图标选择 */}
        {!customImgBase64 && (
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              {t('presetVector')}
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {availableIcons.map(ic => {
                const isCurrent = selectedIcon === ic;
                return (
                  <button
                    key={ic}
                    type="button"
                    className={`btn-icon-only ${isCurrent ? 'active' : ''}`}
                    style={{ width: '26px', height: '26px', padding: 0 }}
                    onClick={() => setSelectedIcon(ic)}
                  >
                    {renderIcon(ic, 16)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ flex: 1, padding: '7px', fontSize: '12px' }}
          >
            {t('saveAndSubmit')}
          </button>
          {!isPresetsManagerMode && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1, padding: '7px', fontSize: '12px' }}
              onClick={() => {
                setName('');
                setModel('');
                setPrice('');
                setCustomImgBase64('');
                setShowModal(false);
              }}
            >
              {lang === 'zh' ? '关闭' : 'Close'}
            </button>
          )}
        </div>
      </form>
    </div>
  );

  if (isPresetsManagerMode) {
    return (
      <>
        <div 
          className="presets-manager-standalone-window"
          style={{
            width: '100%',
            height: '100%',
            padding: '24px',
            background: '#0f172a', // 纯粹的实心底色，不透明，无模糊
            color: 'var(--text-main)',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box'
          }}
        >
          <h3 
            style={{ 
              marginBottom: '18px', 
              textAlign: 'left', 
              fontSize: '16px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              borderBottom: '1px solid rgba(255,255,255,0.1)', 
              paddingBottom: '10px',
              userSelect: 'none'
            }}
          >
            <span style={{ fontWeight: 700 }}>系统产品数据库管理（独立工作台）</span>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={handleImportPresets}
              >
                <Icons.FolderOpen size={11} /> 导入数据库
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={handleExportPresets}
              >
                <Icons.Save size={11} /> 导出数据库
              </button>
            </div>
          </h3>
  
          {/* 左右双栏布局容器 */}
          <div style={{ display: 'flex', gap: '24px', textAlign: 'left', flex: 1, minHeight: 0 }}>
            {renderGridLibrary()}
            {renderAddForm()}
          </div>
        </div>
        {renderMergeImportModal()}
      </>
    );
  }

  return (
    <aside className="sidebar no-print">
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{t('productLibraryTitle')}</h2>
        {onClose && (
          <button 
            type="button" 
            className="sidebar-close-btn" 
            onClick={onClose}
            title={lang === 'zh' ? '收起产品库' : 'Collapse library'}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '4px',
              transition: 'var(--transition-normal)'
            }}
          >
            <Icons.X size={16} />
          </button>
        )}
      </div>

      {/* 新增自定义产品库按钮 */}
      <div style={{ padding: '0 14px 10px 14px' }}>
        <button 
          className="btn btn-secondary" 
          style={{ width: '100%', padding: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          onClick={() => {
            if (window.electronAPI && typeof window.electronAPI.openPresetsManager === 'function') {
              window.electronAPI.openPresetsManager();
            } else {
              setShowModal(true); // 网页版兜底
            }
          }}
        >
          <Icons.PlusSquare size={13} />
          <span>{t('manageDb')}</span>
        </button>
      </div>

      {/* 
        无限动态分类分组排版展示 (支持主侧栏每个分类展开与折叠收纳)
      */}
      {(() => {
        // 动态扫描 presets 列表，计算当前拥有的所有分类
        const categoriesInUse = Array.from(new Set(allPresets.map(p => p.category || 'smart-home')));

        // 统一内置的 3 大分类字典属性 (可在此扩充默认样式)
        const CATEGORY_MAP = {
          'smart-home': { label: t('categorySmartHome'), icon: 'Home', color: 'var(--color-primary)', bg: 'rgba(59, 130, 246, 0.08)' },
          'camera': { label: t('categoryCamera'), icon: 'Camera', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.08)' },
          'security': { label: t('categorySecurity'), icon: 'Shield', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)' }
        };

        const renderDeviceItem = (dev) => (
          <div
            key={dev.type}
            className="device-item"
            style={{ position: 'relative' }}
            onClick={() => onAddDevice(dev)}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', JSON.stringify(dev));
            }}
          >
            {/* 图标渲染：如果有自定义图片，渲染缩略图；否则渲染 Lucide 图标 */}
            <div 
              className="device-icon-container" 
              style={isPresetsManagerMode ? { width: '46px', height: '46px', borderRadius: '10px' } : {}}
            >
              {dev.customImg ? (
                <img 
                  src={dev.customImg} 
                  style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }} 
                  alt={dev.name} 
                />
              ) : (
                renderIcon(dev.icon || 'Cpu')
              )}
            </div>
            
            <div className="device-info">
              <div className="device-name">{dev.name}</div>
              <div className="device-desc">{dev.model}</div>
            </div>
            
            <div className="device-price">RM {dev.price}</div>
          </div>
        );

        return (
          <div className="device-list" style={{ overflowY: 'auto', flex: 1, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '14px' }} onWheel={(e) => e.stopPropagation()}>
            {categoriesInUse.length === 0 ? (
              <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Icons.PlusSquare size={20} style={{ margin: '0 auto 8px auto', display: 'block', color: 'var(--color-primary)' }} />
                <p style={{ marginBottom: '8px', fontSize: '11.5px' }}>{t('productDbEmpty')}</p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '10.5px' }}
                  onClick={() => onUpdateCustomPresets(PRESET_DEVICES)}
                >
                  {t('restoreDefault')}
                </button>
              </div>
            ) : (
              categoriesInUse.map(cat => {
                const devicesInCat = allPresets.filter(p => (p.category || 'smart-home') === cat);
                const catMeta = CATEGORY_MAP[cat] || { label: cat, icon: 'Cpu', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)' };
                const isExpanded = expandedCategories[cat] !== false; // 默认展开
                const GroupIcon = Icons[catMeta.icon] || Icons.Cpu;

                return (
                <div className="category-group" key={cat}>
                  {/* 可折叠的分类 Header */}
                  <div 
                    className="category-header" 
                    onClick={() => toggleCategory(cat)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: catMeta.color,
                      background: catMeta.bg,
                      padding: '8px 10px',
                      borderRadius: '6px',
                      marginBottom: '8px',
                      borderLeft: `3px solid ${catMeta.color}`,
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <GroupIcon size={12} />
                      <span>{catMeta.label} ({devicesInCat.length})</span>
                    </div>
                    {isExpanded ? <Icons.ChevronDown size={12} /> : <Icons.ChevronRight size={12} />}
                  </div>

                  {/* 展开的设备子列表 */}
                  {isExpanded && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {devicesInCat.length === 0 ? (
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', textAlign: 'center', padding: '6px 0', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '6px' }}>{t('noPresetInCat')}</div>
                      ) : (
                        devicesInCat.map(dev => renderDeviceItem(dev))
                      )}
                    </div>
                  )}
                </div>
              );
              })
            )}
          </div>
        );
      })()}

      {/* 管理产品库模态窗口 - 已升级为可自由拖拽的悬浮小窗口 */}
      {showModal && (
        <div 
          className="product-library-floating-modal"
          style={{ 
            position: 'fixed',
            left: `${modalPos.x}px`,
            top: `${modalPos.y}px`,
            width: `${modalSize.w}px`,
            height: `${modalSize.h}px`,
            padding: '24px', 
            background: '#0f172a', // 实心底色，不透明，无模糊
            border: '1px solid var(--border-color)', 
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(59, 130, 246, 0.1)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box'
          }}
        >
          <h3 
            onMouseDown={handleHeaderMouseDown}
            style={{ 
              marginBottom: '18px', 
              textAlign: 'left', 
              fontSize: '16px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              borderBottom: '1px solid rgba(255,255,255,0.1)', 
              paddingBottom: '10px',
              cursor: 'move',
              userSelect: 'none'
            }}
          >
            <span style={{ fontWeight: 700 }}>{t('productDbTitle')}</span>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }} onMouseDown={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={handleImportPresets}
              >
                <Icons.FolderOpen size={11} /> {lang === 'zh' ? '导入数据' : 'Import'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={handleExportPresets}
              >
                <Icons.Save size={11} /> {lang === 'zh' ? '导出数据' : 'Export'}
              </button>
              <button
                type="button"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: '8px',
                  borderRadius: '4px',
                  transition: 'background 0.2s, color 0.2s'
                }}
                className="modal-close-btn"
                onClick={() => {
                  setName('');
                  setModel('');
                  setPrice('');
                  setCustomImgBase64('');
                  setShowModal(false);
                }}
                title="关闭"
              >
                <Icons.X size={16} />
              </button>
            </div>
          </h3>

          {/* 左右双栏布局容器 */}
          <div style={{ display: 'flex', gap: '24px', textAlign: 'left', flex: 1, minHeight: 0 }}>
            {renderGridLibrary()}
            {renderAddForm()}
          </div>

          {/* 右下角拖拽拉伸窗口大小手柄 */}
          <div
            onMouseDown={handleResizeMouseDown}
            style={{
              position: 'absolute',
              right: '0',
              bottom: '0',
              width: '16px',
              height: '16px',
              cursor: 'se-resize',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'flex-end',
              padding: '0 4px 4px 0',
              zIndex: 10
            }}
            title="拖拽可调节窗口大小"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <line x1="6" y1="1" x2="1" y2="6" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="7" y1="4" x2="4" y2="7" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      )}
      {renderMergeImportModal()}
    </aside>
  );
}
