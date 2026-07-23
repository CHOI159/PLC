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

const isPointInPolygon = (point, polygonPoints) => {
  if (!polygonPoints || polygonPoints.length < 3) return false;
  let x = point.x, y = point.y;
  let inside = false;
  for (let i = 0, j = polygonPoints.length - 1; i < polygonPoints.length; j = i++) {
    let xi = polygonPoints[i].x, yi = polygonPoints[i].y;
    let xj = polygonPoints[j].x, yj = polygonPoints[j].y;
    let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi || 1) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

export default function EditorCanvas({
  projectName,
  bgImage,
  devices,
  wires,
  selectedElement,
  canvasMode, // 'select' | 'wire-live' | 'wire-neutral' | 'wire-live-neutral' | 'wire-knx' | 'wire-network' | 'draw-room-polygon'
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
  rooms = [],
  onUpdateRooms,
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

  // 房间多边形绘制状态
  const [activeRoomPoints, setActiveRoomPoints] = useState([]);
  const [activeRoomMousePos, setActiveRoomMousePos] = useState(null);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [pendingRoomPoints, setPendingRoomPoints] = useState([]);
  const [roomNameInput, setRoomNameInput] = useState('客厅');
  const [roomColorInput, setRoomColorInput] = useState('#3b82f6');
  // 房间重命名/改色二次编辑模态窗口状态
  const [editingRoomModal, setEditingRoomModal] = useState(null);

  // 动态检索归属于某个房间多边形的设备 (融合几何坐标落点碰撞与文字 room 属性)
  const getDevicesInRoom = (room) => {
    if (!room) return [];
    return devices.filter(d => {
      if (room.points && isPointInPolygon({ x: d.x, y: d.y }, room.points)) return true;
      return (d.room || '未分配') === room.name;
    });
  };

  // 可拖拽微型房间 Spotlight 浮窗状态
  const [spotlightRoomId, setSpotlightRoomId] = useState(null);
  const [floatingPanelPos, setFloatingPanelPos] = useState({ x: 20, y: 70 });
  const [isDraggingFloatingPanel, setIsDraggingFloatingPanel] = useState(false);
  const dragStartOffsetRef = useRef({ x: 0, y: 0 });

  // 默认画线粗细/线宽 (px)
  const [defaultWireWidth, setDefaultWireWidth] = useState(3.5);

  // 房间印章显示模式与全局缩放比例 (解决低分辨率/小PX底图图片遮挡设备问题)
  const [roomBadgeStyle, setRoomBadgeStyle] = useState('standard'); // 'standard' | 'compact' | 'minimal' | 'hidden'
  const [roomBadgeScale, setRoomBadgeScale] = useState(0.85); // 默认0.85倍缩放适配

  // 房间半透明颜色显示开关与浮动卡片收起/展开状态
  const [showRoomColors, setShowRoomColors] = useState(true);
  const [isRoomPanelCollapsed, setIsRoomPanelCollapsed] = useState(false);

  // 动态同步选区状态：当取消选中房间或选择其他元素 (如设备/线缆/空白处) 时，重置房间高亮，虚线自动恢复
  useEffect(() => {
    if (selectedElement?.type !== 'room' && spotlightRoomId) {
      setSpotlightRoomId(null);
    }
  }, [selectedElement, spotlightRoomId]);

  // 全局监听可拖拽微型浮窗移动
  useEffect(() => {
    const handleMouseMoveFloating = (e) => {
      if (isDraggingFloatingPanel) {
        setFloatingPanelPos({
          x: e.clientX - dragStartOffsetRef.current.x,
          y: e.clientY - dragStartOffsetRef.current.y
        });
      }
    };
    const handleMouseUpFloating = () => {
      if (isDraggingFloatingPanel) {
        setIsDraggingFloatingPanel(false);
      }
    };
    window.addEventListener('mousemove', handleMouseMoveFloating);
    window.addEventListener('mouseup', handleMouseUpFloating);
    return () => {
      window.removeEventListener('mousemove', handleMouseMoveFloating);
      window.removeEventListener('mouseup', handleMouseUpFloating);
    };
  }, [isDraggingFloatingPanel]);

  const handleSaveRoom = () => {
    if (!roomNameInput.trim() || pendingRoomPoints.length < 3) return;
    const rName = roomNameInput.trim();
    const newRoom = {
      id: 'room_' + Date.now(),
      name: rName,
      color: roomColorInput,
      points: pendingRoomPoints
    };

    const updatedRooms = [...rooms, newRoom];
    onUpdateRooms && onUpdateRooms(updatedRooms);

    // 自动扫描全部设备，落入多边形内的设备归属到该房间
    devices.forEach(dev => {
      if (isPointInPolygon({ x: dev.x, y: dev.y }, pendingRoomPoints)) {
        onUpdateDevice && onUpdateDevice(dev.id, { room: rName });
      }
    });

    setRoomModalOpen(false);
    setPendingRoomPoints([]);
    onChangeCanvasMode && onChangeCanvasMode('select');
  };

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

  // 绑定非 Passive 滚轮缩放监听，彻底消除控制台 "Unable to preventDefault" 警告
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onNativeWheel = (e) => {
      e.preventDefault();
      const zoomIntensity = 0.08;
      const rect = container.getBoundingClientRect();
      
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

    container.addEventListener('wheel', onNativeWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onNativeWheel);
    };
  }, [scale, offset, contextMenu.show]);

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

    if (canvasMode === 'draw-room-polygon') {
      const rawCoords = getSVGCoords(e.clientX, e.clientY);
      const coords = getSnappedCoords(rawCoords);

      if (activeRoomPoints.length >= 3) {
        const firstP = activeRoomPoints[0];
        const distToFirst = Math.hypot(coords.x - firstP.x, coords.y - firstP.y);
        if (distToFirst < 20 / scale) {
          setPendingRoomPoints([...activeRoomPoints]);
          setRoomModalOpen(true);
          setActiveRoomPoints([]);
          setActiveRoomMousePos(null);
          return;
        }
      }

      setActiveRoomPoints(prev => [...prev, { x: coords.x, y: coords.y }]);
      return;
    }

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
      setSpotlightRoomId(null);
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
    const snappedCoords = getSnappedCoords(coords);
    setCurrentMousePos(snappedCoords);

    if (canvasMode === 'draw-room-polygon') {
      setActiveRoomMousePos(snappedCoords);
    }

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

      const finalX = Math.round(newX);
      const finalY = Math.round(newY);
      const containingRoom = rooms.find(r => isPointInPolygon({ x: finalX, y: finalY }, r.points));
      const targetDev = devices.find(d => d.id === dragState.targetId);
      const assignedRoom = containingRoom ? containingRoom.name : (targetDev?.room || '未分配');

      onUpdateDevice(dragState.targetId, {
        x: finalX,
        y: finalY,
        room: assignedRoom
      });
    } else if (dragState.type === 'room-vertex') {
      const rawCoords = {
        x: dragState.startPos.x + dx / scale,
        y: dragState.startPos.y + dy / scale
      };
      const snapped = getSnappedCoords(rawCoords);
      const targetRoom = rooms.find(r => r.id === dragState.targetId);
      if (targetRoom) {
        const updatedPoints = [...targetRoom.points];
        updatedPoints[dragState.pointIndex] = { x: Math.round(snapped.x), y: Math.round(snapped.y) };
        const updatedRooms = rooms.map(r => r.id === dragState.targetId ? { ...r, points: updatedPoints } : r);
        onUpdateRooms && onUpdateRooms(updatedRooms);

        // 实时重新计算归属于修改后多边形的全部设备
        devices.forEach(dev => {
          if (isPointInPolygon({ x: dev.x, y: dev.y }, updatedPoints)) {
            onUpdateDevice && onUpdateDevice(dev.id, { room: targetRoom.name });
          }
        });
      }
    } else if (dragState.type === 'room-label') {
      const labelX = Math.round(dragState.startPos.x + dx / scale);
      const labelY = Math.round(dragState.startPos.y + dy / scale);
      const updatedRooms = rooms.map(r => r.id === dragState.targetId ? { ...r, labelPos: { x: labelX, y: labelY } } : r);
      onUpdateRooms && onUpdateRooms(updatedRooms);
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
      points: activeWirePoints,
      strokeWidth: defaultWireWidth
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
        const dropX = Math.round(snapped.x);
        const dropY = Math.round(snapped.y);

        // 自动判定放置落点所在的多边形房间
        const containingRoom = rooms.find(r => isPointInPolygon({ x: dropX, y: dropY }, r.points));
        const assignedRoom = containingRoom ? containingRoom.name : (presetData.room || '未分配');

        onAddDevice(presetData, {
          x: dropX,
          y: dropY,
          room: assignedRoom
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
            <Icons.Plus size={14} /> {lang === 'zh' ? '新建区域' : 'New Area'}
          </button>
        </div>
      </div>

      {/* 复制 Tab 模态浮窗 */}
      {showCloneModal && (
        <div className="clone-modal-overlay" onMouseDown={(e) => e.stopPropagation()}>
          <div className="clone-modal">
            <h3>{lang === 'zh' ? '复制标签区域选项' : 'Duplicate Layout Area Options'}</h3>
            <p>{lang === 'zh' ? `请选择克隆模式，这会为当前区域「${activeTabId ? tabs.find(t=>t.id===activeTabId)?.name : ''}」创建一个副本：` : `Select clone mode to create a duplicate for "${activeTabId ? tabs.find(t=>t.id===activeTabId)?.name : ''}":`}</p>
            <div className="clone-modal-actions">
              <button
                className="btn btn-primary"
                onClick={() => {
                  onDuplicateTab('all');
                  setShowCloneModal(false);
                }}
              >
                {lang === 'zh' ? '克隆全部 (底图+设备+走线)' : 'Clone All (Image, Devices & Wires)'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  onDuplicateTab('bg-only');
                  setShowCloneModal(false);
                }}
              >
                {lang === 'zh' ? '仅复制底图 (无设备与连线)' : 'Clone Image Only (No Devices)'}
              </button>
              <button
                className="btn btn-danger"
                style={{ background: 'transparent', borderColor: 'transparent', color: '#9ca3af', marginTop: '4px' }}
                onClick={() => setShowCloneModal(false)}
              >
                {lang === 'zh' ? '取消' : 'Cancel'}
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

        {/* 不规则多边形房间/区域绘制工具 */}
        <button
          className={`btn-icon-only ${canvasMode === 'draw-room-polygon' ? 'active' : ''}`}
          title="绘制不规则房间/区域 (多边形色块)"
          onClick={() => {
            onSelectElement(null);
            setActiveWirePoints([]);
            setActiveRoomPoints([]);
            onChangeCanvasMode && onChangeCanvasMode('draw-room-polygon');
          }}
          style={{ position: 'relative' }}
        >
          <Icons.BoxSelect size={16} style={{ color: '#38bdf8' }} />
          <span style={{ position: 'absolute', bottom: 2, right: 2, fontSize: '7px', color: '#38bdf8', fontWeight: 700 }}>ZONE</span>
        </button>

        {/* 默认画线粗细控制 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', marginLeft: '2px' }} title="默认画线粗细 (线宽)">
          <select
            value={defaultWireWidth}
            onChange={(e) => setDefaultWireWidth(parseFloat(e.target.value) || 3.5)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#60a5fa',
              fontSize: '10.5px',
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value={2}>{lang === 'zh' ? '2px 细线' : '2px Fine'}</option>
            <option value={3.5}>{lang === 'zh' ? '3.5px 标准' : '3.5px Std'}</option>
            <option value={5}>{lang === 'zh' ? '5px 粗线' : '5px Thick'}</option>
            <option value={8}>{lang === 'zh' ? '8px 特粗' : '8px Heavy'}</option>
            <option value={12}>{lang === 'zh' ? '12px 主干线' : '12px Trunk'}</option>
          </select>
        </div>

        {/* 房间印章显示模式选择 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', marginLeft: '2px' }} title={lang === 'zh' ? "房间印章显示样式" : "Room Stamp Style"}>
          <select
            value={roomBadgeStyle}
            onChange={(e) => setRoomBadgeStyle(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#38bdf8',
              fontSize: '10.5px',
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="standard">{lang === 'zh' ? '🏷️ 标准黑框' : '🏷️ Standard Pill'}</option>
            <option value="compact">{lang === 'zh' ? '🏷️ 迷你小标' : '🏷️ Compact Pill'}</option>
            <option value="minimal">{lang === 'zh' ? '🏷️ 无框纯字' : '🏷️ Borderless Text'}</option>
            <option value="hidden">{lang === 'zh' ? '🙈 隐藏印章' : '🙈 Hide Stamps'}</option>
          </select>
        </div>

        {/* 房间印章缩放比例选择 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', marginLeft: '2px' }} title={lang === 'zh' ? "印章全局缩放（适配小PX底图）" : "Global Stamp Scale"}>
          <select
            value={roomBadgeScale}
            onChange={(e) => setRoomBadgeScale(parseFloat(e.target.value) || 0.85)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#a855f7',
              fontSize: '10.5px',
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value={0.5}>{lang === 'zh' ? '🔍 印章 50%' : '🔍 Stamp 50%'}</option>
            <option value={0.7}>{lang === 'zh' ? '🔍 印章 70%' : '🔍 Stamp 70%'}</option>
            <option value={0.85}>{lang === 'zh' ? '🔍 印章 85%' : '🔍 Stamp 85%'}</option>
            <option value={1.0}>{lang === 'zh' ? '🔍 印章 100%' : '🔍 Stamp 100%'}</option>
            <option value={1.3}>{lang === 'zh' ? '🔍 印章 130%' : '🔍 Stamp 130%'}</option>
          </select>
        </div>

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

        {/* 渲染半透明不规则房间/区域多边形色块 */}
        {rooms.map(room => {
          const isSelected = selectedElement?.type === 'room' && selectedElement.id === room.id;
          const isSpotlight = spotlightRoomId === room.id;
          const isAnySpotlight = Boolean(spotlightRoomId);
          const opacity = showRoomColors
            ? (isAnySpotlight ? (isSpotlight ? 0.35 : 0.05) : (isSelected ? 0.35 : 0.22))
            : 0;
          const strokeWidth = isSpotlight || isSelected ? 3 : 1.5;
          const pointsStr = (room.points || []).map(p => `${p.x},${p.y}`).join(' ');

          let centerX = 0, centerY = 0;
          if (room.points && room.points.length > 0) {
            let sumX = 0, sumY = 0;
            room.points.forEach(p => { sumX += p.x; sumY += p.y; });
            centerX = Math.round(sumX / room.points.length);
            centerY = Math.round(sumY / room.points.length);
          }

          // 动态融合检测落入该房间区域的所有设备
          const roomDevs = getDevicesInRoom(room);
          const roomTotalCost = roomDevs.reduce((sum, d) => sum + (parseFloat(d.price) || 0), 0);

          const badgeX = room.labelPos ? room.labelPos.x : centerX;
          const badgeY = room.labelPos ? room.labelPos.y : centerY;
          const isOffset = room.labelPos && (Math.hypot(badgeX - centerX, badgeY - centerY) > 10);

          return (
            <g key={room.id} className="room-polygon-group">
              <polygon
                points={pointsStr}
                fill={room.color || '#3b82f6'}
                fillOpacity={opacity}
                stroke={room.color || '#3b82f6'}
                strokeWidth={strokeWidth}
                strokeDasharray={isSelected || isSpotlight ? 'none' : '4,4'}
                style={{ transition: 'all 0.2s', cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedElement?.type === 'room' && selectedElement.id === room.id) {
                    onSelectElement(null);
                    setSpotlightRoomId(null);
                  } else {
                    onSelectElement({ type: 'room', id: room.id });
                    setSpotlightRoomId(room.id);
                  }
                }}
              />

              {/* 房间印章拖离质心时的辅助连接虚线 */}
              {isOffset && (
                <line
                  x1={centerX}
                  y1={centerY}
                  x2={badgeX}
                  y2={badgeY}
                  stroke={room.color || '#3b82f6'}
                  strokeWidth={1.2}
                  strokeDasharray="3,3"
                  opacity={0.65}
                  style={{ pointerEvents: 'none' }}
                />
              )}

              {/* 可独立按住拖拽的房间名称与设备统计印章 */}
              {roomBadgeStyle !== 'hidden' && (
                <g
                  transform={`translate(${badgeX}, ${badgeY}) scale(${roomBadgeScale})`}
                  style={{ cursor: 'move', pointerEvents: 'auto' }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDragState({
                      type: 'room-label',
                      targetId: room.id,
                      startX: e.clientX,
                      startY: e.clientY,
                      startPos: { x: badgeX, y: badgeY }
                    });
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectElement({ type: 'room', id: room.id });
                  }}
                  title="按住左键可自由拖拽印章位置，避免遮挡设备"
                >
                  {roomBadgeStyle === 'standard' && (
                    <>
                      <rect
                        x={-55}
                        y={-14}
                        width={110}
                        height={28}
                        rx={14}
                        fill="#0f172a"
                        fillOpacity={0.88}
                        stroke={room.color || '#3b82f6'}
                        strokeWidth={1.5}
                      />
                      <text x={0} y={-1} textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700">
                        {room.name}
                      </text>
                      <text x={0} y={9} textAnchor="middle" fill={room.color || '#3b82f6'} fontSize="8.5" fontWeight="600">
                        {lang === 'zh' ? `${roomDevs.length}件 · ¥${roomTotalCost}` : `${roomDevs.length} pcs · RM ${roomTotalCost}`}
                      </text>
                    </>
                  )}

                  {roomBadgeStyle === 'compact' && (
                    <>
                      <rect
                        x={-42}
                        y={-10}
                        width={84}
                        height={20}
                        rx={10}
                        fill="#0f172a"
                        fillOpacity={0.85}
                        stroke={room.color || '#3b82f6'}
                        strokeWidth={1.2}
                      />
                      <text x={0} y={4} textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="700">
                        {room.name} ({roomDevs.length})
                      </text>
                    </>
                  )}

                  {roomBadgeStyle === 'minimal' && (
                    <text
                      x={0}
                      y={4}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="800"
                      style={{
                        stroke: '#0f172a',
                        strokeWidth: '3px',
                        paintOrder: 'stroke fill',
                        filter: `drop-shadow(0 0 4px ${room.color || '#3b82f6'})`
                      }}
                    >
                      {room.name}
                    </text>
                  )}
                </g>
              )}

              {/* 选中时的多边形顶点可拖拽控制节点 */}
              {isSelected && (room.points || []).map((p, pIdx) => (
                <circle
                  key={pIdx}
                  cx={p.x}
                  cy={p.y}
                  r={6 / scale}
                  fill="#ffffff"
                  stroke={room.color || '#3b82f6'}
                  strokeWidth={2.5}
                  style={{ cursor: 'move', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDragState({
                      type: 'room-vertex',
                      targetId: room.id,
                      pointIndex: pIdx,
                      startX: e.clientX,
                      startY: e.clientY,
                      startPos: { ...p }
                    });
                  }}
                  title="按住拖拽微调房间拐角节点"
                />
              ))}
            </g>
          );
        })}

        {/* 正在绘制的多边形实时预览 */}
        {canvasMode === 'draw-room-polygon' && activeRoomPoints.length > 0 && (
          <g className="temp-room-polygon">
            <polygon
              points={activeRoomPoints.map(p => `${p.x},${p.y}`).join(' ') + (activeRoomMousePos ? ` ${activeRoomMousePos.x},${activeRoomMousePos.y}` : '')}
              fill="rgba(56, 189, 248, 0.15)"
              stroke="#38bdf8"
              strokeWidth={2}
              strokeDasharray="5,5"
            />
            {activeRoomPoints.map((p, idx) => (
              <circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r={idx === 0 ? 6 : 4}
                fill={idx === 0 ? '#38bdf8' : '#ffffff'}
                stroke="#38bdf8"
                strokeWidth={2}
              />
            ))}
          </g>
        )}

        {/* 绘制强电及弱电多走线系统 */}
        {wires.map((wire) => {
          const isSelected = selectedElement?.type === 'wire' && selectedElement.id === wire.id;
          const pointsString = wire.points.map(p => `${p.x},${p.y}`).join(' ');
          const wireWidth = wire.strokeWidth || (wire.type === 'knx' || wire.type === 'network' ? 4 : 3);
          const wireWidthLN = wire.strokeWidth || 4.5;

          return (
            <g key={wire.id}>
              {/* 选中时的外发光底衬 */}
              <polyline
                points={pointsString}
                className="svg-wire-bg-glow"
                stroke={wire.type === 'live-neutral' ? '#ef4444' : wire.color}
                style={{ strokeWidth: isSelected ? Math.max(12, wireWidth + 6) : wireWidth + 4, display: isSelected ? 'block' : 'none' }}
              />
              
              {/* 普通线路绘制 (非双色零火线) */}
              {wire.type !== 'live-neutral' && (
                <polyline
                  points={pointsString}
                  className={`svg-wire ${isSelected ? 'selected' : ''}`}
                  stroke={wire.color}
                  strokeWidth={wireWidth}
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
                    strokeWidth={wireWidthLN}
                    fill="none"
                  />
                  <polyline
                    points={getOffsetPoints(wire.points, 6).map(p => `${p.x},${p.y}`).join(' ')}
                    stroke="#3b82f6"
                    strokeWidth={wireWidthLN}
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
                strokeWidth={defaultWireWidth}
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

      {/* 可拖拽微型房间 Spotlight 浮窗 */}
      {rooms.length > 0 && (
        isRoomPanelCollapsed ? (
          <div
            style={{
              position: 'absolute',
              left: `${floatingPanelPos.x}px`,
              top: `${floatingPanelPos.y}px`,
              background: 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '20px',
              padding: '6px 12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              zIndex: 90,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'grab',
              color: '#f8fafc',
              fontSize: '11px',
              fontWeight: 700,
              userSelect: 'none'
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsDraggingFloatingPanel(true);
              dragStartOffsetRef.current = {
                x: e.clientX - floatingPanelPos.x,
                y: e.clientY - floatingPanelPos.y
              };
            }}
          >
            <Icons.GripHorizontal size={14} style={{ color: '#94a3b8' }} />
            <Icons.BoxSelect size={14} style={{ color: '#38bdf8' }} />
            <span>{lang === 'zh' ? `房间聚焦 (${rooms.length})` : `Room Area Focus (${rooms.length})`}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsRoomPanelCollapsed(false);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
              title={lang === 'zh' ? "展开房间聚焦卡片" : "Expand Room Focus Panel"}
            >
              <Icons.ChevronDown size={14} />
            </button>
          </div>
        ) : (
          <div
            style={{
              position: 'absolute',
              left: `${floatingPanelPos.x}px`,
              top: `${floatingPanelPos.y}px`,
              width: '235px',
              background: 'rgba(15, 23, 42, 0.88)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '12px',
              boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
              zIndex: 90,
              userSelect: 'none',
              overflow: 'hidden'
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* 拖拽 Handle Header */}
            <div
              style={{
                padding: '8px 10px',
                background: 'rgba(255,255,255,0.05)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'grab',
                fontSize: '11px',
                fontWeight: 700,
                color: '#f8fafc'
              }}
              onMouseDown={(e) => {
                setIsDraggingFloatingPanel(true);
                dragStartOffsetRef.current = {
                  x: e.clientX - floatingPanelPos.x,
                  y: e.clientY - floatingPanelPos.y
                };
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Icons.GripHorizontal size={14} style={{ color: '#94a3b8' }} />
                <span>{lang === 'zh' ? `房间区域聚焦 (${rooms.length})` : `Room Spotlight (${rooms.length})`}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {/* 房间半透明色彩显/隐控制按钮 */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRoomColors(prev => !prev);
                  }}
                  style={{
                    background: showRoomColors ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                    border: `1px solid ${showRoomColors ? '#38bdf8' : 'rgba(255,255,255,0.2)'}`,
                    color: showRoomColors ? '#38bdf8' : '#94a3b8',
                    borderRadius: '4px',
                    padding: '2px 5px',
                    fontSize: '9.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                  title={showRoomColors ? (lang === 'zh' ? "点击关闭房间填色层" : "Hide room fill colors") : (lang === 'zh' ? "点击开启房间填色层" : "Show room fill colors")}
                >
                  {showRoomColors ? <Icons.Eye size={11} /> : <Icons.EyeOff size={11} />}
                  <span>{showRoomColors ? (lang === 'zh' ? "开色" : "Color") : (lang === 'zh' ? "关色" : "Hide")}</span>
                </button>

                {spotlightRoomId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSpotlightRoomId(null);
                      onSelectElement(null);
                    }}
                    style={{
                      background: 'rgba(56, 189, 248, 0.2)',
                      border: '1px solid #38bdf8',
                      color: '#38bdf8',
                      borderRadius: '4px',
                      padding: '1px 5px',
                      fontSize: '9px',
                      cursor: 'pointer'
                    }}
                  >
                    {lang === 'zh' ? '重置' : 'Reset'}
                  </button>
                )}

                {/* 折叠收起按钮 */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRoomPanelCollapsed(true);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title={lang === 'zh' ? "收起为胶囊按钮" : "Collapse panel"}
                >
                  <Icons.ChevronUp size={14} />
                </button>
              </div>
            </div>

            {/* 房间列表 */}
            <div style={{ padding: '8px', maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {rooms.map(room => {
                const roomDevs = getDevicesInRoom(room);
                const roomCost = roomDevs.reduce((sum, d) => sum + (parseFloat(d.price) || 0), 0);
                const isSpotlighted = spotlightRoomId === room.id;

                return (
                  <div
                    key={room.id}
                    onClick={() => {
                      if (selectedElement?.type === 'room' && selectedElement.id === room.id) {
                        onSelectElement(null);
                        setSpotlightRoomId(null);
                      } else {
                        onSelectElement({ type: 'room', id: room.id });
                        setSpotlightRoomId(room.id);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      background: isSpotlighted ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.02)',
                      border: isSpotlighted ? '1px solid #38bdf8' : '1px solid transparent',
                      cursor: 'pointer',
                      fontSize: '11px',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: room.color || '#3b82f6', flexShrink: 0 }} />
                      <span style={{ color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {room.name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                        {lang === 'zh' ? `${roomDevs.length}件 · ¥${roomCost}` : `${roomDevs.length} pcs · RM ${roomCost}`}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingRoomModal({ room, name: room.name, color: room.color || '#3b82f6' });
                        }}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                        title="编辑房间名称与颜色"
                      >
                        <Icons.Edit3 size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateRooms && onUpdateRooms(rooms.filter(r => r.id !== room.id));
                          if (spotlightRoomId === room.id) setSpotlightRoomId(null);
                        }}
                        style={{ background: 'none', border: 'none', color: '#ef4444', opacity: 0.6, cursor: 'pointer', padding: '2px' }}
                        title="删除该房间区域"
                      >
                        <Icons.Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* 房间多边形绘制完成后的命名与颜色分配弹窗 */}
      {roomModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              width: '350px',
              background: '#1e293b',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.BoxSelect size={18} style={{ color: '#38bdf8' }} />
              <span>创建新房间/区域</span>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                房间/区域名称
              </label>
              <input
                type="text"
                value={roomNameInput}
                onChange={(e) => setRoomNameInput(e.target.value)}
                placeholder="请输入房间名称 (如：客厅)"
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none'
                }}
                autoFocus
              />
              
              {/* 快捷选词 Chip 按钮组 */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {['客厅', '主卧', '次卧', '厨房', '卫生间', '玄关', '阳台', '走廊/过道'].map(name => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setRoomNameInput(name)}
                    style={{
                      background: roomNameInput === name ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.05)',
                      border: roomNameInput === name ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                      color: roomNameInput === name ? '#38bdf8' : '#ccc',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                区域标识颜色
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {['#3b82f6', '#10b981', '#a855f7', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'].map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setRoomColorInput(color)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: color,
                      border: roomColorInput === color ? '2px solid #fff' : 'none',
                      boxShadow: roomColorInput === color ? '0 0 8px ' + color : 'none',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setRoomModalOpen(false);
                  setPendingRoomPoints([]);
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveRoom}
                style={{
                  background: 'var(--color-primary)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '6px',
                  padding: '6px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                保存房间
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 房间重命名与改色二次编辑模态窗口 */}
      {editingRoomModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              width: '350px',
              background: '#1e293b',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.Edit3 size={18} style={{ color: '#38bdf8' }} />
              <span>编辑房间/区域</span>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                房间/区域名称
              </label>
              <input
                type="text"
                value={editingRoomModal.name}
                onChange={(e) => setEditingRoomModal({ ...editingRoomModal, name: e.target.value })}
                placeholder="如：客厅、主卧、走廊"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                主题标识颜色
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {['#3b82f6', '#10b981', '#a855f7', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'].map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setEditingRoomModal({ ...editingRoomModal, color })}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: color,
                      border: editingRoomModal.color === color ? '2px solid #fff' : 'none',
                      boxShadow: editingRoomModal.color === color ? '0 0 8px ' + color : 'none',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setEditingRoomModal(null)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  const oldName = editingRoomModal.room.name;
                  const newName = editingRoomModal.name.trim() || oldName;
                  const newColor = editingRoomModal.color;

                  const updatedRooms = rooms.map(r => r.id === editingRoomModal.room.id ? { ...r, name: newName, color: newColor } : r);
                  onUpdateRooms && onUpdateRooms(updatedRooms);

                  devices.forEach(dev => {
                    if (dev.room === oldName || (editingRoomModal.room.points && isPointInPolygon({ x: dev.x, y: dev.y }, editingRoomModal.room.points))) {
                      onUpdateDevice && onUpdateDevice(dev.id, { room: newName });
                    }
                  });

                  setEditingRoomModal(null);
                }}
                style={{
                  background: 'var(--color-primary)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '6px',
                  padding: '6px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
