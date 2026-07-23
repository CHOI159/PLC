import React, { useState, useRef, useEffect } from 'react';
import * as Icons from 'lucide-react';

// 计算朝上方向的伞形扇形路径 (用于摄像机监控视角显示，支持动态范围和视角)
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

// 计算导线折点的几何中点，用于渲染气泡删除按钮
const getWireCenter = (points) => {
  if (!points || points.length === 0) return { x: 0, y: 0 };
  let sumX = 0, sumY = 0;
  points.forEach(p => { sumX += p.x; sumY += p.y; });
  return { x: Math.round(sumX / points.length), y: Math.round(sumY / points.length) };
};

// 折线角平分线平行偏置算法 (确保任意拐弯转角处火线和零线绝对不相交或重合)
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

export default function EditorCanvas({
  projectName,
  bgImage,
  devices,
  wires,
  selectedElement,
  canvasMode, // 'select' | 'wire-live' | 'wire-neutral' | 'wire-live-neutral' | 'wire-knx' | 'wire-network'
  scale,
  offset,
  onUpdateScale,
  onUpdateOffset,
  onAddDevice,
  onUpdateDevice,
  onAddWire,
  onUpdateWire,
  onSelectElement,
  onFileSelect,
  onDeleteElement,
  onChangeCanvasMode, // 画完或切换时重置模式的回调
  highlightedDeviceId, // 高光定位 ID
  onClearBgImage, // 清空底图回调
  onUpdateActiveTabDimensions, // 反馈底图物理长宽
  
  // 多 Tabs
  tabs = [],
  activeTabId,
  onSelectTab,
  onAddTab,
  onDuplicateTab,
  onRenameTab,
  onDeleteTab,
  lang = 'zh'
}) {
  const TRANSLATIONS = {
    zh: {
      canvasDragTip: "从侧边栏拖拽产品放入画布",
      canvasClear: "清空连线",
      canvasDelete: "删除选定",
      canvasGuide: "辅助对齐线已开启 (磁吸 8px)",
      wireTypeNetwork: "网络双绞线 (Cat6)",
      wireTypeKnx: "KNX/RS485 控制总线",
      wireTypePower: "AC 220V 电源强电线",
      wireTypeNeutral: "零火联络线 / 辅线",
      uploadBgBtn: "为当前区域「{name}」导入平面图",
      uploadTip: "支持选择 PNG, JPG 图片或 PDF 格式图纸。双击标签页文字可修改名称。",
      renameTip: "双击重命名",
      clearBgTip: "清除此区域的背景平面图纸",
      copyAreaTip: "复制当前区域",
      deleteAreaTip: "删除此区域",
      scaleRatio: "缩放比例",
      deleteDevice: "删除产品设备",
      rotateDeviceTip: "拖动旋转方向",
      resizeDeviceTip: "拖拽拉伸缩放",
      selectDragMode: "选择与拖拽模式",
      wireLive: "火线绘制 (红色实线)",
      wireNeutral: "零线绘制 (蓝色虚线)",
      wireLiveNeutral: "零火线并行绘制 (红蓝交错双绞线)",
      wireKnx: "KNX 智能控制线绘制 (绿色总线)",
      wireNetwork: "CAT6 网络网线绘制 (黄色网络线)",
      zoomIn: "放大",
      zoomOut: "缩小",
      fitCenter: "自适应居中"
    },
    en: {
      canvasDragTip: "Drag products from sidebar onto canvas",
      canvasClear: "Clear Wires",
      canvasDelete: "Delete Selected",
      canvasGuide: "Alignment guides active (snap 8px)",
      wireTypeNetwork: "Ethernet (Cat6)",
      wireTypeKnx: "KNX/RS485 Bus",
      wireTypePower: "AC 220V Power Line",
      wireTypeNeutral: "Neutral Contact Line",
      uploadBgBtn: "Import floorplan for area \"{name}\"",
      uploadTip: "Supports PNG, JPG or PDF drawings. Double click tab title to rename.",
      renameTip: "Double click to rename",
      clearBgTip: "Clear background floorplan for this area",
      copyAreaTip: "Duplicate current area",
      deleteAreaTip: "Delete this area",
      scaleRatio: "Zoom Scale",
      deleteDevice: "Delete Device",
      rotateDeviceTip: "Drag to rotate",
      resizeDeviceTip: "Drag to resize",
      selectDragMode: "Select & Drag Mode",
      wireLive: "Live Wire (Red Solid)",
      wireNeutral: "Neutral Wire (Blue Dashed)",
      wireLiveNeutral: "Live/Neutral Parallel Wire (Twisted)",
      wireKnx: "KNX Control Bus (Green Line)",
      wireNetwork: "CAT6 Network Wire (Yellow Line)",
      zoomIn: "Zoom In",
      zoomOut: "Zoom Out",
      fitCenter: "Fit to Center"
    }
  };

  const t = (key) => {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['zh']?.[key] || key;
  };

  const containerRef = useRef(null);
  const svgRef = useRef(null);
  
  // 正在绘制的导线临时节点
  const [activeWirePoints, setActiveWirePoints] = useState([]);
  const [currentMousePos, setCurrentMousePos] = useState({ x: 0, y: 0 });
  const [alignGuides, setAlignGuides] = useState({ x: null, y: null });
  
  // Tab 重命名状态
  const [editingTabId, setEditingTabId] = useState(null);
  const [editingName, setEditingName] = useState('');

  // 底图真实尺寸状态
  const [bgDimensions, setBgDimensions] = useState({ w: 2000, h: 2000 });

  // 复制 Tab 的模态窗口状态
  const [showCloneModal, setShowCloneModal] = useState(false);

  // 右键快捷菜单状态
  const [contextMenu, setContextMenu] = useState({
    show: false,
    x: 0,
    y: 0,
    targetId: null
  });

  // 拖动状态 (旋转、平移、缩放)
  const [dragState, setDragState] = useState({
    type: null, 
    targetId: null,
    pointIndex: null,
    startX: 0,
    startY: 0,
    startOffset: { x: 0, y: 0 },
    startPos: { x: 0, y: 0 },
    startRotation: 0,
    startSize: 48,
    startDist: 0,
    devCenterX: 0,
    devCenterY: 0
  });

  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // 监听键盘空格与 Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT') {
        setIsSpacePressed(true);
        e.preventDefault();
      }
      if (e.code === 'Escape') {
        setActiveWirePoints([]);
        setContextMenu({ show: false, x: 0, y: 0, targetId: null });
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // 自适应居中
  const resetViewToCenter = (imgUrl) => {
    if (!imgUrl) return;
    const tempImg = new Image();
    tempImg.src = imgUrl;
    tempImg.onload = () => {
      const container = containerRef.current;
      if (!container) return;
      const cWidth = container.clientWidth;
      const cHeight = container.clientHeight;
      
      const imgW = tempImg.naturalWidth || 2000;
      const imgH = tempImg.naturalHeight || 2000;
      setBgDimensions({ w: imgW, h: imgH });
      onUpdateActiveTabDimensions && onUpdateActiveTabDimensions(imgW, imgH);
      
      const padding = 80;
      const scaleX = (cWidth - padding) / imgW;
      const scaleY = (cHeight - padding - 80) / imgH;
      
      let optimalScale = Math.min(scaleX, scaleY);
      optimalScale = Math.max(0.15, Math.min(optimalScale, 1.0));
      
      const offsetX = (cWidth - imgW * optimalScale) / 2;
      const offsetY = (cHeight - imgH * optimalScale) / 2 + 24;
      
      onUpdateScale(optimalScale);
      onUpdateOffset({ x: offsetX, y: offsetY });
    };
  };

  useEffect(() => {
    if (bgImage) {
      resetViewToCenter(bgImage);
    }
  }, [bgImage]);

  // 监听画布尺寸改变自适应
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (bgImage) {
        resetViewToCenter(bgImage);
      }
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [bgImage]);

  const getSVGCoords = (clientX, clientY) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = (clientX - rect.left) / scale;
    const y = (clientY - rect.top) / scale;
    return { x, y };
  };

  const getSnappedCoords = (coords) => {
    const SNAP_RADIUS = 36;
    for (const dev of devices) {
      const dist = Math.hypot(coords.x - dev.x, coords.y - dev.y);
      if (dist < SNAP_RADIUS) {
        return { x: dev.x, y: dev.y, snapped: true };
      }
    }
    return { ...coords, snapped: false };
  };

  // 滚轮缩放
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomIntensity = 0.08;
    const rect = containerRef.current.getBoundingClientRect();
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const svgX = (mouseX - offset.x) / scale;
    const svgY = (mouseY - offset.y) / scale;

    let newScale = scale + (e.deltaY < 0 ? 1 : -1) * zoomIntensity * scale;
    newScale = Math.max(0.1, Math.min(newScale, 5.0));

    const newOffsetX = mouseX - svgX * newScale;
    const newOffsetY = mouseY - svgY * newScale;

    onUpdateScale(newScale);
    onUpdateOffset({ x: newOffsetX, y: newOffsetY });
    
    if (contextMenu.show) setContextMenu({ show: false, x: 0, y: 0, targetId: null });
  };

  // 容器鼠标按下
  const handleContainerMouseDown = (e) => {
    if (contextMenu.show) {
      setContextMenu({ show: false, x: 0, y: 0, targetId: null });
    }

    if (e.button === 1 || e.button === 2 || (e.button === 0 && isSpacePressed)) {
      setDragState({
        type: 'pan',
        startX: e.clientX,
        startY: e.clientY,
        startOffset: { ...offset }
      });
      e.preventDefault();
      return;
    }

    if (e.button !== 0) return;

    if (canvasMode.startsWith('wire')) {
      const rawCoords = getSVGCoords(e.clientX, e.clientY);
      const coords = getSnappedCoords(rawCoords);
      setActiveWirePoints(prev => [...prev, { x: coords.x, y: coords.y }]);
      return;
    }

    if (canvasMode === 'select' && (e.target.tagName === 'svg' || e.target.tagName === 'rect' && e.target.fill === 'url(#grid)')) {
      setDragState({
        type: 'pan',
        startX: e.clientX,
        startY: e.clientY,
        startOffset: { ...offset }
      });
      onSelectElement(null);
    }
  };

  // 激活拖拽设备移动
  const handleDeviceDragStart = (e, devId) => {
    if (canvasMode !== 'select') return; // 画线模式下不予拦截冒泡，直接放行，支持设备磁吸起笔与落笔
    e.stopPropagation();
    
    onSelectElement({ type: 'device', id: devId });
    const dev = devices.find(d => d.id === devId);
    
    setDragState({
      type: 'device',
      targetId: devId,
      startX: e.clientX,
      startY: e.clientY,
      startPos: { x: dev.x, y: dev.y }
    });
  };

  // 激活拖拽旋转手柄
  const handleDeviceRotateStart = (e, devId) => {
    e.stopPropagation();
    e.preventDefault();
    if (canvasMode !== 'select') return;

    const dev = devices.find(d => d.id === devId);
    if (!dev) return;

    const rect = svgRef.current.getBoundingClientRect();
    const devCenterX = dev.x * scale + rect.left;
    const devCenterY = dev.y * scale + rect.top;

    setDragState({
      type: 'device-rotate',
      targetId: devId,
      startX: e.clientX,
      startY: e.clientY,
      startRotation: dev.rotation || 0,
      devCenterX,
      devCenterY
    });
  };

  // 激活拖拽雷达旋转手柄
  const handleRadarRotateStart = (e, devId) => {
    e.stopPropagation();
    e.preventDefault();
    if (canvasMode !== 'select') return;

    const dev = devices.find(d => d.id === devId);
    if (!dev) return;

    const rect = svgRef.current.getBoundingClientRect();
    const devCenterX = dev.x * scale + rect.left;
    const devCenterY = dev.y * scale + rect.top;

    setDragState({
      type: 'radar-rotate',
      targetId: devId,
      startX: e.clientX,
      startY: e.clientY,
      startRotation: dev.fovRotation !== undefined ? dev.fovRotation : (dev.rotation || 0),
      devCenterX,
      devCenterY
    });
  };

  // 激活拖拽等比缩放手柄 ("拱门")
  const handleDeviceResizeStart = (e, devId) => {
    e.stopPropagation();
    e.preventDefault();
    if (canvasMode !== 'select') return;

    const dev = devices.find(d => d.id === devId);
    if (!dev) return;

    const rect = svgRef.current.getBoundingClientRect();
    const devCenterX = dev.x * scale + rect.left;
    const devCenterY = dev.y * scale + rect.top;

    setDragState({
      type: 'device-resize',
      targetId: devId,
      startX: e.clientX,
      startY: e.clientY,
      startSize: dev.size || 48,
      startDist: Math.hypot(e.clientX - devCenterX, e.clientY - devCenterY),
      devCenterX,
      devCenterY
    });
  };

  // 连线折点拖动
  const handleWirePointDragStart = (e, wireId, index) => {
    e.stopPropagation();
    if (canvasMode !== 'select') return;

    onSelectElement({ type: 'wire', id: wireId });
    const wire = wires.find(w => w.id === wireId);

    setDragState({
      type: 'wire-point',
      targetId: wireId,
      pointIndex: index,
      startX: e.clientX,
      startY: e.clientY,
      startPos: { ...wire.points[index] }
    });
  };

  // 容器MouseMove捕获
  const handleContainerMouseMove = (e) => {
    const coords = getSVGCoords(e.clientX, e.clientY);
    setCurrentMousePos(getSnappedCoords(coords));

    if (!dragState.type) return;

    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;

    if (dragState.type === 'pan') {
      onUpdateOffset({
        x: dragState.startOffset.x + dx,
        y: dragState.startOffset.y + dy
      });
    } else if (dragState.type === 'device') {
      let newX = dragState.startPos.x + dx / scale;
      let newY = dragState.startPos.y + dy / scale;

      // 磁吸吸附计算
      let alignX = null;
      let alignY = null;
      const snapThreshold = 8; // 8像素对齐磁力吸附

      for (const dev of devices) {
        if (dev.id === dragState.targetId) continue;

        // X坐标吸附对齐
        if (Math.abs(newX - dev.x) < snapThreshold) {
          newX = dev.x;
          alignX = dev.x;
        }
        // Y坐标吸附对齐
        if (Math.abs(newY - dev.y) < snapThreshold) {
          newY = dev.y;
          alignY = dev.y;
        }
      }

      setAlignGuides({ x: alignX, y: alignY });

      onUpdateDevice(dragState.targetId, {
        x: Math.round(newX),
        y: Math.round(newY)
      });
    } else if (dragState.type === 'device-rotate') {
      const dyAngle = e.clientY - dragState.devCenterY;
      const dxAngle = e.clientX - dragState.devCenterX;
      let angle = Math.atan2(dyAngle, dxAngle) * 180 / Math.PI;
      
      let finalAngle = Math.round(angle + 90);
      finalAngle = (finalAngle + 360) % 360;
      
      const step = 15;
      finalAngle = Math.round(finalAngle / step) * step;
      onUpdateDevice(dragState.targetId, { rotation: finalAngle });
    } else if (dragState.type === 'radar-rotate') {
      const dyAngle = e.clientY - dragState.devCenterY;
      const dxAngle = e.clientX - dragState.devCenterX;
      let angle = Math.atan2(dyAngle, dxAngle) * 180 / Math.PI;
      
      let finalAngle = Math.round(angle + 90);
      finalAngle = (finalAngle + 360) % 360;
      
      const step = 15;
      finalAngle = Math.round(finalAngle / step) * step;
      onUpdateDevice(dragState.targetId, { fovRotation: finalAngle });
    } else if (dragState.type === 'device-resize') {
      const currentDist = Math.hypot(e.clientX - dragState.devCenterX, e.clientY - dragState.devCenterY);
      if (dragState.startDist > 0) {
        const newSize = Math.round(dragState.startSize * (currentDist / dragState.startDist));
        const boundedSize = Math.max(24, Math.min(120, newSize));
        onUpdateDevice(dragState.targetId, { size: boundedSize });
      }
    } else if (dragState.type === 'wire-point') {
      const rawCoords = {
        x: dragState.startPos.x + dx / scale,
        y: dragState.startPos.y + dy / scale
      };
      const snapped = getSnappedCoords(rawCoords);

      const wire = wires.find(w => w.id === dragState.targetId);
      if (wire) {
        const newPoints = [...wire.points];
        newPoints[dragState.pointIndex] = { x: snapped.x, y: snapped.y };
        onUpdateWire(dragState.targetId, { points: newPoints });
      }
    }
  };

  const handleContainerMouseUp = () => {
    setAlignGuides({ x: null, y: null }); // 清除辅助对齐线
    setDragState(prev => ({
      ...prev,
      type: null,
      targetId: null
    }));
  };

  // 支持 5 种不同线缆类型绘制
  const finishWireDrawing = (e) => {
    if (e) e.preventDefault();
    if (activeWirePoints.length < 2) {
      setActiveWirePoints([]);
      return;
    }

    let type = 'live';
    let color = '#ef4444';

    if (canvasMode === 'wire-neutral') {
      type = 'neutral';
      color = '#3b82f6';
    } else if (canvasMode === 'wire-live-neutral') {
      type = 'live-neutral';
      color = '#f59e0b'; // 双色并绘
    } else if (canvasMode === 'wire-knx') {
      type = 'knx';
      color = '#10b981';
    } else if (canvasMode === 'wire-network') {
      type = 'network';
      color = '#eab308';
    }

    onAddWire({
      type,
      color,
      points: activeWirePoints
    });

    setActiveWirePoints([]);
    
    // 画完后自动切回选择模式，提升操作体验
    onChangeCanvasMode && onChangeCanvasMode('select');
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (canvasMode.startsWith('wire') && activeWirePoints.length > 0) {
      finishWireDrawing();
    }
  };

  // 右键点击产品设备
  const handleDeviceContextMenu = (e, devId) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectElement({ type: 'device', id: devId });
    
    const rect = containerRef.current.getBoundingClientRect();
    const menuX = e.clientX - rect.left;
    const menuY = e.clientY - rect.top;

    setContextMenu({
      show: true,
      x: menuX,
      y: menuY,
      targetId: devId
    });
  };

  // 右键菜单：水平镜像翻转
  const handleMirrorDevice = () => {
    const dev = devices.find(d => d.id === contextMenu.targetId);
    if (dev) {
      onUpdateDevice(contextMenu.targetId, { flipX: !dev.flipX });
    }
    setContextMenu({ show: false, x: 0, y: 0, targetId: null });
  };

  // 右键菜单：开启/关闭伞形雷达范围
  const handleToggleFov = () => {
    const dev = devices.find(d => d.id === contextMenu.targetId);
    if (dev) {
      onUpdateDevice(contextMenu.targetId, { showFov: !dev.showFov });
    }
    setContextMenu({ show: false, x: 0, y: 0, targetId: null });
  };

  // 右键菜单：开启/关闭圆形感应范围
  const handleToggleCircleFov = () => {
    const dev = devices.find(d => d.id === contextMenu.targetId);
    if (dev) {
      onUpdateDevice(contextMenu.targetId, { showCircleFov: !dev.showCircleFov });
    }
    setContextMenu({ show: false, x: 0, y: 0, targetId: null });
  };

  // 右键菜单：更换颜色
  const handleSelectColor = (colorCode) => {
    onUpdateDevice(contextMenu.targetId, { color: colorCode });
    setContextMenu({ show: false, x: 0, y: 0, targetId: null });
  };

  // 右键菜单：尺寸微调
  const handleAdjustSize = (amount) => {
    const dev = devices.find(d => d.id === contextMenu.targetId);
    if (dev) {
      const currentSize = dev.size || 48;
      const newSize = Math.max(24, Math.min(120, currentSize + amount));
      onUpdateDevice(contextMenu.targetId, { size: newSize });
    }
    setContextMenu({ show: false, x: 0, y: 0, targetId: null });
  };

  // 右键菜单：清除设备
  const handleDeleteDevice = () => {
    if (contextMenu.targetId) {
      onDeleteElement && onDeleteElement(contextMenu.targetId, 'device');
    }
    setContextMenu({ show: false, x: 0, y: 0, targetId: null });
  };

  // 右键菜单：复制设备 (克隆所有属性并偏移 30 像素)
  const handleCopyDevice = () => {
    const dev = devices.find(d => d.id === contextMenu.targetId);
    if (dev) {
      const offsetX = Math.max(50, Math.min(1950, dev.x + 30));
      const offsetY = Math.max(50, Math.min(1950, dev.y + 30));
      onAddDevice(dev, { x: offsetX, y: offsetY });
    }
    setContextMenu({ show: false, x: 0, y: 0, targetId: null });
  };

  const renderDeviceSVGIcon = (iconName, color = '#3b82f6') => {
    const IconComponent = Icons[iconName] || Icons.Cpu;
    return (
      <foreignObject x="-16" y="-16" width="32" height="32" style={{ pointerEvents: 'none' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          color: color,
        }}>
          <IconComponent size={20} />
        </div>
      </foreignObject>
    );
  };

  const handleFinishRename = (tabId) => {
    const trimmed = editingName.trim();
    if (trimmed) {
      onRenameTab(tabId, trimmed);
    }
    setEditingTabId(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    try {
      const presetData = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (presetData) {
        const rawCoords = getSVGCoords(e.clientX, e.clientY);
        const snapped = getSnappedCoords(rawCoords);
        onAddDevice(presetData, {
          x: Math.round(snapped.x),
          y: Math.round(snapped.y)
        });
      }
    } catch (err) {
      console.error("Drop device failed:", err);
    }
  };

  // 4色快捷选项
  const presetColors = [
    { code: '#3b82f6', label: '科技蓝' },
    { code: '#ef4444', label: '安防红' },
    { code: '#10b981', label: '安全绿' },
    { code: '#f59e0b', label: '提示黄' }
  ];

  return (
    <div
      ref={containerRef}
      className="canvas-container"
      onWheel={handleWheel}
      onMouseDown={handleContainerMouseDown}
      onMouseMove={handleContainerMouseMove}
      onMouseUp={handleContainerMouseUp}
      onMouseLeave={handleContainerMouseUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onContextMenu={handleContextMenu}
    >
      {/* 顶部标签页切换栏 */}
      <div className="tabs-bar no-print">
        <div className="tabs-scroll-area">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                className={`tab-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onSelectTab(tab.id);
                  onSelectElement(null);
                  setActiveWirePoints([]);
                }}
              >
                {editingTabId === tab.id ? (
                  <input
                    type="text"
                    className="tab-name-input"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleFinishRename(tab.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFinishRename(tab.id);
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className="tab-name-text"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingTabId(tab.id);
                      setEditingName(tab.name);
                    }}
                    title={t('renameTip')}
                  >
                    {tab.name}
                  </span>
                )}
                
                {tab.bgImage && (
                  <button
                    className="tab-action-btn clear-bg-btn"
                    title={t('clearBgTip')}
                    onClick={(e) => {
                      e.stopPropagation();
                      const confirmMsg = lang === 'zh'
                        ? `确定要清除区域「${tab.name}」中的背景平面图纸吗？\n（此操作仅清空背景图纸，设备与连线仍将完好保留）`
                        : `Are you sure you want to clear the background floorplan in area "${tab.name}"?\n(This action only removes the background image; devices and wires will remain intact.)`;
                      if (window.confirm(confirmMsg)) {
                        onClearBgImage && onClearBgImage(tab.id);
                      }
                    }}
                  >
                    <Icons.Eraser size={11} />
                  </button>
                )}

                <button
                  className="tab-action-btn copy-btn"
                  title={t('copyAreaTip')}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTab(tab.id);
                    setShowCloneModal(true);
                  }}
                >
                  <Icons.Copy size={11} />
                </button>
                
                {tabs.length > 1 && (
                  <button
                    className="tab-action-btn delete-btn"
                    title={t('deleteAreaTip')}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTab(tab.id);
                    }}
                  >
                    <Icons.X size={11} />
                  </button>
                )}
              </div>
            );
          })}
          
          <button className="add-tab-btn" onClick={onAddTab}>
            <Icons.Plus size={14} /> 新建区域
          </button>
        </div>
      </div>

      {/* 复制 Tab 模态浮窗 */}
      {showCloneModal && (
        <div className="clone-modal-overlay" onMouseDown={(e) => e.stopPropagation()}>
          <div className="clone-modal">
            <h3>复制标签区域选项</h3>
            <p>请选择克隆模式，这会为当前区域「{activeTabId ? tabs.find(t=>t.id===activeTabId)?.name : ''}」创建一个副本：</p>
            <div className="clone-modal-actions">
              <button
                className="btn btn-primary"
                onClick={() => {
                  onDuplicateTab('all');
                  setShowCloneModal(false);
                }}
              >
                克隆全部 (底图+设备+走线)
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  onDuplicateTab('bg-only');
                  setShowCloneModal(false);
                }}
              >
                仅复制底图 (无设备与连线)
              </button>
              <button
                className="btn btn-danger"
                style={{ background: 'transparent', borderColor: 'transparent', color: '#9ca3af', marginTop: '4px' }}
                onClick={() => setShowCloneModal(false)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 右键快捷菜单 (Glassmorphism 毛玻璃) */}
      {contextMenu.show && (
        <div 
          className="canvas-context-menu no-print"
          style={{ 
            top: `${contextMenu.y}px`, 
            left: `${contextMenu.x}px`,
            width: '188px'
          }}
          onMouseDown={(e) => e.stopPropagation()} 
        >
          {/* 左右镜像翻转 */}
          <div className="context-menu-item" onClick={handleMirrorDevice}>
            <Icons.Columns size={13} />
            <span>左右镜像翻转</span>
          </div>
          
          {/* 开启/关闭雷达可视面积 */}
          <div className="context-menu-item" onClick={handleToggleFov}>
            <Icons.Eye size={13} />
            <span>
              {devices.find(d => d.id === contextMenu.targetId)?.showFov ? '关闭监控范围' : '开启监控范围'}
            </span>
          </div>

          {/* 开启/关闭圆形感应范围 */}
          <div className="context-menu-item" onClick={handleToggleCircleFov}>
            <Icons.Eye size={13} />
            <span>
              {devices.find(d => d.id === contextMenu.targetId)?.showCircleFov ? '关闭圆形感应范围' : '开启圆形感应范围'}
            </span>
          </div>

          {/* 复制产品设备 */}
          <div className="context-menu-item" onClick={handleCopyDevice}>
            <Icons.Copy size={13} />
            <span>复制此产品图标</span>
          </div>

          <div className="context-menu-divider" />

          {/* 换色选择器 */}
          <div className="context-menu-label" style={{ fontSize: '10.5px', color: 'var(--text-muted)', padding: '4px 10px 0 10px' }}>
            更换产品图标/防区颜色
          </div>
          <div style={{ display: 'flex', gap: '8px', padding: '6px 12px 8px 12px', justifyContent: 'space-between' }}>
            {presetColors.map((colorObj) => {
              const isCurrent = devices.find(d => d.id === contextMenu.targetId)?.color === colorObj.code;
              return (
                <button
                  key={colorObj.code}
                  className={`context-color-ball ${isCurrent ? 'active' : ''}`}
                  style={{ backgroundColor: colorObj.code }}
                  title={colorObj.label}
                  onClick={() => handleSelectColor(colorObj.code)}
                />
              );
            })}
          </div>

          <div className="context-menu-divider" />

          {/* 精准大小微调 */}
          <div style={{ display: 'flex', gap: '4px', padding: '2px 6px' }}>
            <button className="context-size-btn" onClick={() => handleAdjustSize(6)} title="放大">
              <Icons.ZoomIn size={12} />
              <span>放大</span>
            </button>
            <button className="context-size-btn" onClick={() => handleAdjustSize(-6)} title="缩小">
              <Icons.ZoomOut size={12} />
              <span>缩小</span>
            </button>
          </div>

          <div className="context-menu-divider" />

          {/* 删除设备 */}
          <div className="context-menu-item danger" onClick={handleDeleteDevice}>
            <Icons.Trash2 size={13} />
            <span>{t('deleteDevice')}</span>
          </div>
        </div>
      )}

      {/* 绝对物理居中底图上传提示层 */}
      {!bgImage && (
        <div className="upload-container-absolute" onMouseDown={(e) => e.stopPropagation()}>
          <div className="upload-overlay" onClick={onFileSelect}>
            <Icons.UploadCloud className="upload-icon" size={48} />
            <h3>{t('uploadBgBtn').replace('{name}', tabs.find(t=>t.id===activeTabId)?.name || 'Untitled')}</h3>
            <p>
              {t('uploadTip')}
            </p>
          </div>
        </div>
      )}

      {/* 核心工具栏 - 扩充为 5 种不同弱电/强电走线类型 */}
      <div className="canvas-toolbar no-print" style={{ top: '64px' }} onMouseDown={(e) => e.stopPropagation()}>
        <button
          className={`btn-icon-only ${canvasMode === 'select' ? 'active' : ''}`}
          title={t('selectDragMode')}
          onClick={() => {
            setActiveWirePoints([]);
            onSelectElement(null);
            document.activeElement?.blur();
            onChangeCanvasMode && onChangeCanvasMode('select');
          }}
        >
          <Icons.MousePointer size={16} />
        </button>

        <button
          className={`btn-icon-only ${canvasMode === 'wire-live' ? 'active' : ''}`}
          title={t('wireLive')}
          onClick={() => {
            onSelectElement(null);
            setActiveWirePoints([]);
            onChangeCanvasMode && onChangeCanvasMode('wire-live');
          }}
          style={{ position: 'relative' }}
        >
          <Icons.Activity size={16} style={{ color: '#ef4444' }} />
          <span style={{ position: 'absolute', bottom: 2, right: 2, fontSize: '8px', color: '#ef4444', fontWeight: 700 }}>L</span>
        </button>

        <button
          className={`btn-icon-only ${canvasMode === 'wire-neutral' ? 'active' : ''}`}
          title={t('wireNeutral')}
          onClick={() => {
            onSelectElement(null);
            setActiveWirePoints([]);
            onChangeCanvasMode && onChangeCanvasMode('wire-neutral');
          }}
          style={{ position: 'relative' }}
        >
          <Icons.Activity size={16} style={{ color: '#3b82f6' }} />
          <span style={{ position: 'absolute', bottom: 2, right: 2, fontSize: '8px', color: '#3b82f6', fontWeight: 700 }}>N</span>
        </button>

        {/* 强电零火双线并行线 */}
        <button
          className={`btn-icon-only ${canvasMode === 'wire-live-neutral' ? 'active' : ''}`}
          title={t('wireLiveNeutral')}
          onClick={() => {
            onSelectElement(null);
            setActiveWirePoints([]);
            onChangeCanvasMode && onChangeCanvasMode('wire-live-neutral');
          }}
          style={{ position: 'relative' }}
        >
          <Icons.Activity size={16} style={{ color: '#a855f7' }} />
          <span style={{ position: 'absolute', bottom: 2, right: 2, fontSize: '8px', color: '#a855f7', fontWeight: 700 }}>LN</span>
        </button>

        {/* KNX绿色控制总线 */}
        <button
          className={`btn-icon-only ${canvasMode === 'wire-knx' ? 'active' : ''}`}
          title={t('wireKnx')}
          onClick={() => {
            onSelectElement(null);
            setActiveWirePoints([]);
            onChangeCanvasMode && onChangeCanvasMode('wire-knx');
          }}
          style={{ position: 'relative' }}
        >
          <Icons.Activity size={16} style={{ color: '#10b981' }} />
          <span style={{ position: 'absolute', bottom: 2, right: 2, fontSize: '7px', color: '#10b981', fontWeight: 700 }}>KNX</span>
        </button>

        {/* 弱电网线 */}
        <button
          className={`btn-icon-only ${canvasMode === 'wire-network' ? 'active' : ''}`}
          title={t('wireNetwork')}
          onClick={() => {
            onSelectElement(null);
            setActiveWirePoints([]);
            onChangeCanvasMode && onChangeCanvasMode('wire-network');
          }}
          style={{ position: 'relative' }}
        >
          <Icons.Activity size={16} style={{ color: '#eab308' }} />
          <span style={{ position: 'absolute', bottom: 2, right: 2, fontSize: '7px', color: '#eab308', fontWeight: 700 }}>NET</span>
        </button>

        <div className="toolbar-divider"></div>

        <button className="btn-icon-only" title={t('zoomIn')} onClick={() => onUpdateScale(Math.min(5.0, scale + 0.1))}>
          <Icons.ZoomIn size={16} />
        </button>
        <div className="canvas-scale-indicator">{Math.round(scale * 100)}%</div>
        <button className="btn-icon-only" title={t('zoomOut')} onClick={() => onUpdateScale(Math.max(0.1, scale - 0.1))}>
          <Icons.ZoomOut size={16} />
        </button>
        <button 
          className="btn-icon-only" 
          title={t('fitCenter')} 
          onClick={() => {
            if (bgImage) resetViewToCenter(bgImage);
            else {
              onUpdateScale(1.0);
              onUpdateOffset({ x: 0, y: 0 });
            }
          }}
        >
          <Icons.Maximize size={16} />
        </button>
      </div>

      {/* SVG 编辑画布 */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className="editor-svg"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          marginTop: '40px',
          overflow: 'visible'
        }}
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" className="grid-line" />
            <path d="M 200 0 L 0 0 0 200" fill="none" className="grid-line-major" />
          </pattern>
        </defs>
        
        {/* 十万像素级 AutoCAD 无限网格桌布背景 (有底图时隐藏) */}
        {!bgImage && (
          <rect x="-50000" y="-50000" width="100000" height="100000" fill="url(#grid)" />
        )}

        {/* 平面图背景 (基于真实 natural 长宽动态渲染，彻底纠正偏边 Bug) */}
        {bgImage && (
          <image
            href={bgImage}
            width={bgDimensions.w}
            height={bgDimensions.h}
            preserveAspectRatio="xMidYMid meet"
            opacity="0.8"
          />
        )}

        {/* 绘制强电及弱电多走线系统 */}
        {wires.map((wire) => {
          const isSelected = selectedElement?.type === 'wire' && selectedElement.id === wire.id;
          const pointsString = wire.points.map(p => `${p.x},${p.y}`).join(' ');

          return (
            <g key={wire.id}>
              {/* 选中时的外发光底衬 */}
              <polyline
                points={pointsString}
                className="svg-wire-bg-glow"
                stroke={wire.type === 'live-neutral' ? '#ef4444' : wire.color}
                style={{ strokeWidth: isSelected ? 12 : 8, display: isSelected ? 'block' : 'none' }}
              />
              
              {/* 普通线路绘制 (非双色零火线) */}
              {wire.type !== 'live-neutral' && (
                <polyline
                  points={pointsString}
                  className={`svg-wire ${isSelected ? 'selected' : ''}`}
                  stroke={wire.color}
                  strokeWidth={wire.type === 'knx' || wire.type === 'network' ? 4 : 3}
                  strokeDasharray={wire.type === 'neutral' ? '6,6' : 'none'}
                />
              )}

              {/* 强电零火并行线并列交织渲染 (红色实线打底，同折点叠绘蓝色虚线，效果极具写实感) */}
              {wire.type === 'live-neutral' && (
                <>
                  <polyline
                    points={pointsString}
                    className={`svg-wire ${isSelected ? 'selected' : ''}`}
                    stroke="#ef4444"
                    strokeWidth={4.5}
                    fill="none"
                  />
                  <polyline
                    points={getOffsetPoints(wire.points, 6).map(p => `${p.x},${p.y}`).join(' ')}
                    stroke="#3b82f6"
                    strokeWidth={4.5}
                    strokeDasharray="6,6"
                    fill="none"
                    style={{ pointerEvents: 'none' }}
                  />
                </>
              )}

              <polyline
                points={pointsString}
                className="svg-wire-interactive"
                onClick={(e) => {
                  e.stopPropagation();
                  if (canvasMode === 'select') {
                    onSelectElement({ type: 'wire', id: wire.id });
                  }
                }}
              />
            </g>
          );
        })}

        {/* 正在绘制的导线预览 */}
        {activeWirePoints.length > 0 && (
          <g className="temp-wire">
            {canvasMode !== 'wire-live-neutral' ? (
              <polyline
                points={[
                  ...activeWirePoints,
                  { x: currentMousePos.x, y: currentMousePos.y }
                ].map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={
                  canvasMode === 'wire-live' ? '#ef4444' :
                  canvasMode === 'wire-neutral' ? '#3b82f6' :
                  canvasMode === 'wire-knx' ? '#10b981' : '#eab308'
                }
                strokeWidth={canvasMode === 'wire-knx' || canvasMode === 'wire-network' ? 4 : 3}
                strokeDasharray={canvasMode === 'wire-neutral' ? '6,6' : 'none'}
                style={{ opacity: 0.6 }}
              />
            ) : (
              // 零火双线预览
              <>
                <polyline
                  points={[
                    ...activeWirePoints,
                    { x: currentMousePos.x, y: currentMousePos.y }
                  ].map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth={4.5}
                  style={{ opacity: 0.6 }}
                />
                <polyline
                  points={getOffsetPoints([
                    ...activeWirePoints,
                    { x: currentMousePos.x, y: currentMousePos.y }
                  ], 6).map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={4.5}
                  strokeDasharray="6,6"
                  style={{ opacity: 0.8 }}
                />
              </>
            )}
            <text
              x={currentMousePos.x + 15}
              y={currentMousePos.y - 15}
              fill={currentMousePos.snapped ? '#10b981' : '#9ca3af'}
              fontSize="12"
              fontWeight={700}
            >
              {currentMousePos.snapped ? '✓ 吸附至设备' : '点击落脚点 (右键结束)'}
            </text>
          </g>
        )}

        {/* 选中导线的控制点 */}
        {selectedElement?.type === 'wire' && wires.find(w => w.id === selectedElement.id)?.points.map((pt, idx) => {
          const wire = wires.find(w => w.id === selectedElement.id);
          return (
            <circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r={5}
              className="wire-handle"
              onMouseDown={(e) => handleWirePointDragStart(e, wire.id, idx)}
            />
          );
        })}

        {/* 
          选中导线的几何中点悬浮气泡删除按钮 
          完美契合用户一键删线逻辑！
        */}
        {selectedElement?.type === 'wire' && (() => {
          const wire = wires.find(w => w.id === selectedElement.id);
          if (!wire || wire.points.length === 0) return null;
          const center = getWireCenter(wire.points);
          return (
            <foreignObject
              x={center.x - 14}
              y={center.y - 14}
              width="28"
              height="28"
              className="no-print"
            >
              <button
                className="wire-delete-bubble"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteElement && onDeleteElement(wire.id, 'wire');
                  onSelectElement(null);
                }}
                title="删除此线路"
              >
                <Icons.Trash2 size={11} style={{ color: '#fff' }} />
              </button>
            </foreignObject>
          );
        })()}

        {/* 智能设备终端 (支持等比缩放、旋转、镜像、雷达参数精细滑块联动及自定义真实图片导入) */}
        {devices.map((dev) => {
          const isSelected = selectedElement?.type === 'device' && selectedElement.id === dev.id;
          const scaleFactor = (dev.size || 48) / 48;
          const currentRotation = dev.rotation || 0;
          const devColor = dev.color || '#3b82f6';
          
          return (
            <g
              key={dev.id}
              className={`svg-device ${isSelected ? 'selected' : ''}`}
              onMouseDown={(e) => handleDeviceDragStart(e, dev.id)}
              onClick={(e) => {
                e.stopPropagation();
                if (canvasMode === 'select') {
                  onSelectElement({ type: 'device', id: dev.id });
                }
              }}
              onContextMenu={(e) => handleDeviceContextMenu(e, dev.id)}
            >
              {/* 外层主坐标组 */}
              <g transform={`translate(${dev.x}, ${dev.y})`}>
                
                {/* 
                  1. 雷达与感应阴影图层 (不受设备 currentRotation 物理牵连，使用 fovRotation 独立旋转以实现解耦)
                */}
                <g transform={`rotate(${dev.fovRotation !== undefined ? dev.fovRotation : currentRotation}) scale(${scaleFactor})`}>
                  {dev.showFov && (
                    <>
                      {/* 正向伞形区域 */}
                      <path
                        d={getFovPath(dev.fovRange || 160, dev.fovAngle || 80)}
                        fill={`${dev.fovColor || devColor}1a`}
                        stroke={dev.fovColor || devColor}
                        strokeWidth="1.2"
                        strokeDasharray="4,4"
                        style={{ pointerEvents: 'none' }}
                      />
                      {/* 镜面反向伞形区域 (防护系统双向防护) */}
                      {dev.showDoubleFov && (
                        <path
                          d={getFovPath(dev.fovRange || 160, dev.fovAngle || 80)}
                          transform="rotate(180)"
                          fill={`${dev.fovColor || devColor}1a`}
                          stroke={dev.fovColor || devColor}
                          strokeWidth="1.2"
                          strokeDasharray="4,4"
                          style={{ pointerEvents: 'none' }}
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
                      style={{ pointerEvents: 'none' }}
                    />
                  )}
                </g>

                {/* 雷达旋转手柄 (仅在选中且开启伞形雷达时渲染，在雷达中轴线的边缘顶点) */}
                {isSelected && dev.showFov && (
                  <g transform={`rotate(${dev.fovRotation !== undefined ? dev.fovRotation : currentRotation}) scale(${scaleFactor})`}>
                    {/* 旋转连接线 (虚线) */}
                    <line
                      x1="0"
                      y1={-(dev.fovRange || 160)}
                      x2="0"
                      y2={-(dev.fovRange || 160) - 15}
                      stroke={dev.fovColor || devColor}
                      strokeWidth="1.2"
                      strokeDasharray="2,2"
                    />
                    {/* 旋转感应圆球 */}
                    <circle
                      cx="0"
                      cy={-(dev.fovRange || 160) - 15}
                      r="6"
                      className="radar-rotate-handle"
                      style={{ 
                        fill: '#f59e0b',
                        stroke: '#ffffff',
                        strokeWidth: 1.5,
                        cursor: 'alias',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                      }}
                      onMouseDown={(e) => handleRadarRotateStart(e, dev.id)}
                      title="按住并拖动旋转雷达照射方向"
                    />
                  </g>
                )}

                {/* 
                  内层图标层：仅应用设备本体旋转 rotate(currentRotation)
                */}
                <g transform={`rotate(${currentRotation}) scale(${(dev.flipX ? -1 : 1) * scaleFactor}, ${scaleFactor})`}>
                  
                  {/* 透明事件捕获垫底层：防 pointer-events: none 穿透 Bug，确保自定义图片能完美响应拖拽与右键 */}
                  <rect
                    x="-24"
                    y="-24"
                    width="48"
                    height="48"
                    fill="transparent"
                    style={{ cursor: 'move' }}
                  />

                  {/* 自定义图片底衬外框：移除白色实心底，替换为可自定义主题颜色的外边框 (outline) */}
                  {dev.customImg && (
                    <rect
                      x="-26"
                      y="-26"
                      width="52"
                      height="52"
                      fill="rgba(255, 255, 255, 0.04)"
                      rx="8"
                      style={{
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
                        stroke: isSelected ? 'var(--color-primary)' : (dev.color || '#3b82f6'),
                        strokeWidth: isSelected ? 2.5 : 1.5
                      }}
                    />
                  )}

                  {/* 自定义产品库导入的真实高清图片渲染，若无则兜底渲染矢量图标 */}
                  {dev.customImg ? (
                    <foreignObject x="-24" y="-24" width="48" height="48" style={{ pointerEvents: 'none' }}>
                      <img
                        src={dev.customImg}
                        className={dev.id === highlightedDeviceId ? 'pulse-focus' : ''}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          borderRadius: '8px'
                        }}
                        alt={dev.name}
                      />
                    </foreignObject>
                  ) : (
                    <>
                      <rect
                        x="-24"
                        y="-24"
                        width="48"
                        height="48"
                        className={`svg-device-bg ${dev.id === highlightedDeviceId ? 'pulse-focus' : ''}`}
                      />
                      {renderDeviceSVGIcon(dev.icon || 'Cpu', devColor)}
                    </>
                  )}
                </g>



                {/* 
                  控制手柄层：仅在选中时呈现，且跟图表大小和旋转完全一致
                */}
                <g transform={`rotate(${currentRotation}) scale(${scaleFactor})`}>
                  {isSelected && (
                    <>
                      {/* 选择虚线框 */}
                      <rect
                        x="-28"
                        y="-28"
                        width="56"
                        height="56"
                        fill="none"
                        stroke={devColor}
                        strokeWidth="1.5"
                        strokeDasharray="3,3"
                      />
                      
                      {/* 旋转手柄 */}
                      <line
                        x1="0"
                        y1="-28"
                        x2="0"
                        y2="-46"
                        stroke={devColor}
                        strokeWidth="1.5"
                      />
                      <circle
                        cx="0"
                        cy="-46"
                        r="5"
                        className="control-handle-rotate"
                        style={{ stroke: devColor }}
                        onMouseDown={(e) => handleDeviceRotateStart(e, dev.id)}
                        title={t('rotateDeviceTip')}
                      />

                      {/* 右下角拉伸缩放的圆弧“拱门”把手 */}
                      <path
                        d="M 12,28 A 16,16 0 0,0 28,12"
                        fill="none"
                        className="control-handle-resize"
                        style={{ stroke: devColor }}
                        onMouseDown={(e) => handleDeviceResizeStart(e, dev.id)}
                        title={t('resizeDeviceTip')}
                      />
                    </>
                  )}
                </g>



              </g>
            </g>
          );
        })}
        {/* 临时对齐吸附辅助线 */}
        {alignGuides.x !== null && (
          <line
            x1={alignGuides.x}
            y1="0"
            x2={alignGuides.x}
            y2="2000"
            stroke="#f59e0b"
            strokeWidth="1.2"
            strokeDasharray="4,4"
            style={{ pointerEvents: 'none', opacity: 0.8 }}
          />
        )}
        {alignGuides.y !== null && (
          <line
            x1="0"
            y1={alignGuides.y}
            x2="2000"
            y2={alignGuides.y}
            stroke="#f59e0b"
            strokeWidth="1.2"
            strokeDasharray="4,4"
            style={{ pointerEvents: 'none', opacity: 0.8 }}
          />
        )}

      </svg>
    </div>
  );
}
