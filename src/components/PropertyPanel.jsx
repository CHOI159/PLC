import React, { useState } from 'react';
import { Trash2, ShieldAlert, ChevronDown, ChevronUp, AlertCircle, Compass } from 'lucide-react';

export default function PropertyPanel({
  selectedElement,
  devices, // 全屋加总设备
  wires,
  extraCosts,
  onUpdateDevice,
  onUpdateWire,
  onDeleteElement,
  onUpdateExtraCosts,
  
  // 新增回调
  onChangeDeviceCount,
  onDeleteDeviceGroup,
  activeTabName,
  onFocusDeviceModel, // 新增循环定位视角回调
  lang = 'zh'
}) {
  const TRANSLATIONS = {
    zh: {
      readOnlyTag: "只读",
      deviceName: "设备名称",
      deviceModel: "规格型号",
      devicePrice: "预算单价",
      deviceSize: "设备图标大小",
      deviceColor: "设备标志主题色 (Outline 描边)",
      roomLabel: "所属房间/区域",
      unassigned: "未分配区域",
      addBtn: "添加",
      addRoomPlaceholder: "如：客厅、主卧",
      roomStatsTitle: "按房间区域硬件预算汇总",
      elementProperties: "元素属性与参数",
      selectTip: "点击画布中的智能硬件或线缆进行属性编辑",
      deviceDetail: "设备详情 (只读保护已激活)",
      wireDetail: "布线路径详情",
      wireType: "线缆类型",
      wireColor: "连线颜色",
      wireTypeNetwork: "网络双绞线 (Cat6)",
      wireTypeKnx: "KNX/RS485 控制总线",
      wireTypePower: "AC 220V 电源强电线",
      wireTypeNeutral: "零火联络线 / 辅线",
      deleteBtn: "永久删除此元素",
      quoteSummary: "本方案本层设备报价明细",
      productName: "产品名称",
      specModel: "规格型号",
      unitPrice: "单价",
      count: "数量",
      subtotal: "小计",
      totalQuote: "项目总计报价",
      devicesSubtotal: "设备小计",
      laborCost: "工本费 (含工料施工税费)",
      discountRate: "折扣比例",
      autoLaborTip: "留空即自动按设备总价的15%计算工本费",
      emptyTabTip: "当前图纸未放置任何产品，请从左侧产品库中拖入"
    },
    en: {
      readOnlyTag: "ReadOnly",
      deviceName: "Device Name",
      deviceModel: "Spec Model",
      devicePrice: "Price",
      deviceSize: "Device Icon Size",
      deviceColor: "Device Outline Theme Color",
      roomLabel: "Assigned Room/Area",
      unassigned: "Unassigned Area",
      addBtn: "Add",
      addRoomPlaceholder: "e.g., Living Room, Master Bedroom",
      roomStatsTitle: "Hardware Budget by Room Area",
      elementProperties: "Properties Panel",
      selectTip: "Select a device or wire on the canvas to edit properties",
      deviceDetail: "Device Properties (Read-Only)",
      wireDetail: "Cable Routing Details",
      wireType: "Cable Type",
      wireColor: "Line Color",
      wireTypeNetwork: "Ethernet Cable (Cat6)",
      wireTypeKnx: "KNX/RS485 Bus",
      wireTypePower: "AC 220V Power Line",
      wireTypeNeutral: "Neutral Contact Wire",
      deleteBtn: "Delete Selected Element",
      quoteSummary: "Floor Device Quote Summary",
      productName: "Product Name",
      specModel: "Spec Model",
      unitPrice: "Unit Price",
      count: "Qty",
      subtotal: "Subtotal",
      totalQuote: "Total Project Quote",
      devicesSubtotal: "Devices Subtotal",
      laborCost: "Labor & Fees",
      discountRate: "Discount Rate",
      autoLaborTip: "Leave blank to automatically calculate as 15% of device total",
      emptyTabTip: "No products on this floor. Drag from library."
    }
  };

  const t = (key) => {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['zh']?.[key] || key;
  };
  // Accordion 状态：各个大区是否打开
  const [isPropsOpen, setIsPropsOpen] = useState(true);
  const [isListOpen, setIsListOpen] = useState(true);
  const [isSummaryOpen, setIsSummaryOpen] = useState(true);

  // 本地临时字符串状态，用于消除受控组件退格删除闪烁和前导 0 的体验问题
  const [inputLabor, setInputLabor] = useState('');
  const [inputLaborRate, setInputLaborRate] = useState('');
  const [inputDiscount, setInputDiscount] = useState('');

  // Layout 面板独立调整高度的状态 (统计面板默认限高 220px 开启局部滚动，其余为 null 自适应)
  const [propsHeight, setPropsHeight] = useState(null);
  const [listHeight, setListHeight] = useState(220);
  const [summaryHeight, setSummaryHeight] = useState(null);

  // 拖动底部边框调节面板高度的事件处理器
  const handleSectionResizeStart = (e, sectionKey) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startY = e.clientY;
    let startHeight = 0;
    
    const wrapper = e.currentTarget.parentElement;
    if (wrapper) {
      startHeight = wrapper.offsetHeight;
    }

    const handleMouseMove = (moveEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.max(100, Math.min(600, startHeight + deltaY));
      
      if (sectionKey === 'props') setPropsHeight(newHeight);
      else if (sectionKey === 'list') setListHeight(newHeight);
      else if (sectionKey === 'summary') setSummaryHeight(newHeight);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 查找选中的设备或线 (仅限当前活跃选中的)
  const selectedDevice = selectedElement?.type === 'device' 
    ? devices.find(d => d.id === selectedElement.id) 
    : null;

  const selectedWire = selectedElement?.type === 'wire'
    ? wires.find(w => w.id === selectedElement.id)
    : null;

  // 收集当前图纸中所有已分配的房间/区域 (去重并提供初始默认)
  const getExistingRooms = () => {
    const defaultRooms = lang === 'zh'
      ? ['未分配', '客厅', '主卧', '次卧', '厨房', '卫生间']
      : ['Unassigned', 'Living Room', 'Master Bed', 'Second Bed', 'Kitchen', 'Bathroom'];
    const rooms = new Set(defaultRooms);
    devices.forEach(d => {
      if (d.room) {
        rooms.add(d.room);
      }
    });
    return Array.from(rooms);
  };
  const existingRooms = getExistingRooms();

  // 按房间/区域统计硬件预算总额
  const getRoomBudgetStats = () => {
    const stats = {};
    devices.forEach(d => {
      const r = d.room || '未分配';
      if (!stats[r]) {
        stats[r] = { room: r, total: 0, count: 0 };
      }
      stats[r].total += Number(d.price) || 0;
      stats[r].count += 1;
    });
    return Object.values(stats).sort((a, b) => b.total - a.total);
  };
  const roomBudgetStats = getRoomBudgetStats();

  // 统计产品数量和价格 (按型号分类统计)
  const getDeviceStats = () => {
    const stats = {};
    devices.forEach(d => {
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
  const devicesTotal = devices.reduce((sum, d) => sum + (Number(d.price) || 0), 0);
  
  // 工本费计算：如果为空字符则默认联动 15%，否则直接使用用户输入的自定义金额
  const laborCost = extraCosts.labor === ''
    ? Number((devicesTotal * 0.15).toFixed(2))
    : Number(Number(extraCosts.labor) || 0);

  // 比例换算：工本费占产品硬件总价的百分比，保留两位小数
  const laborRate = devicesTotal === 0
    ? (extraCosts.labor === '' ? 15 : 0)
    : Number(((laborCost / devicesTotal) * 100).toFixed(2));
    
  // 折扣百分比及项目总计报价，保留两位小数
  const discountPercent = Number(extraCosts.discount) || 0;
  const finalTotal = Number((devicesTotal * (1 - discountPercent / 100) + laborCost).toFixed(2));

  // 同步外部状态到本地字符串输入框，仅在非聚焦时同步，解决退格删除闪烁和前导 0 交互缺陷
  React.useEffect(() => {
    if (document.activeElement !== document.getElementById('input-labor')) {
      setInputLabor(extraCosts.labor === '' ? '' : String(extraCosts.labor));
    }
    if (document.activeElement !== document.getElementById('input-labor-rate')) {
      setInputLaborRate(extraCosts.labor === '' ? '15' : String(laborRate));
    }
    if (document.activeElement !== document.getElementById('input-discount')) {
      setInputDiscount(extraCosts.discount === '' ? '' : String(extraCosts.discount));
    }
  }, [extraCosts, devicesTotal, laborRate]);

  // 失去焦点时的输入格式校验和对齐纠偏
  const handleBlur = (field) => {
    if (field === 'labor') {
      setInputLabor(extraCosts.labor === '' ? '' : String(extraCosts.labor));
    } else if (field === 'laborRate') {
      setInputLaborRate(extraCosts.labor === '' ? '15' : String(laborRate));
    } else if (field === 'discount') {
      setInputDiscount(extraCosts.discount === '' ? '' : String(extraCosts.discount));
    }
  };

  return (
    <aside className="property-panel" onWheel={(e) => e.stopPropagation()}>
      <div className="panel-header">
        <h2>{lang === 'zh' ? '配置与报价面板' : 'Config & Quote Panel'}</h2>
      </div>

      <div className="panel-body">
        
        {/* 1. 属性配置区 */}
        <div className="section-container">
          <div 
            className="section-title-clickable"
            onClick={() => setIsPropsOpen(!isPropsOpen)}
            title="点击展开或收起"
          >
            <span>{t('elementProperties')}</span>
            {isPropsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
          
          {isPropsOpen && (
            <div 
              className="section-content-wrapper" 
              style={{ height: propsHeight ? `${propsHeight}px` : 'auto', display: 'flex', flexDirection: 'column', position: 'relative', paddingBottom: '6px' }}
            >
              <div className="section-content-scroll" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              {selectedDevice ? (
                <div className="form-container">
                  <div className="form-group">
                    <label>{t('deviceName')} <span style={{ fontSize: '11px', color: '#64748b' }}>({t('readOnlyTag')})</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedDevice.name}
                      readOnly
                      style={{ cursor: 'not-allowed', opacity: 0.7, backgroundColor: 'rgba(255, 255, 255, 0.04)', color: '#94a3b8' }}
                      title="此信息由产品库提供，不可直接在画布上修改"
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('deviceModel')} <span style={{ fontSize: '11px', color: '#64748b' }}>({t('readOnlyTag')})</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedDevice.model}
                      readOnly
                      style={{ cursor: 'not-allowed', opacity: 0.7, backgroundColor: 'rgba(255, 255, 255, 0.04)', color: '#94a3b8' }}
                      title="此信息由产品库提供，不可直接在画布上修改"
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('devicePrice')} (RM) <span style={{ fontSize: '11px', color: '#64748b' }}>({t('readOnlyTag')})</span></label>
                    <input
                      type="number"
                      className="form-control"
                      value={selectedDevice.price}
                      readOnly
                      style={{ cursor: 'not-allowed', opacity: 0.7, backgroundColor: 'rgba(255, 255, 255, 0.04)', color: '#94a3b8' }}
                      title="此信息由产品库提供，不可直接在画布上修改"
                    />
                  </div>

                  {/* 设备图标渲染尺寸调整 (支持 5px - 200px) */}
                  <div className="form-group" style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('deviceSize')}</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <input
                          type="number"
                          min="5"
                          max="200"
                          style={{
                            width: '56px',
                            padding: '2px 4px',
                            fontSize: '11.5px',
                            background: 'rgba(0,0,0,0.25)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--color-primary)',
                            fontWeight: 600,
                            borderRadius: '4px',
                            textAlign: 'right'
                          }}
                          value={selectedDevice.size || 48}
                          onChange={(e) => {
                            const val = Math.max(5, Math.min(200, parseInt(e.target.value) || 0));
                            onUpdateDevice(selectedDevice.id, { size: val });
                          }}
                        />
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>px</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="200"
                      step="1"
                      style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                      value={selectedDevice.size || 48}
                      onChange={(e) => onUpdateDevice(selectedDevice.id, { size: parseInt(e.target.value) || 48 })}
                    />
                  </div>

                  {/* 新增：设备主题标志颜色修改面板 (支持所有设备，包括自定义PNG图片描边轮廓) */}
                  <div className="form-group" style={{ marginTop: '12px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      {t('deviceColor')}
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[
                        { code: '#3b82f6', label: '科技蓝' },
                        { code: '#ef4444', label: '安防红' },
                        { code: '#10b981', label: '安全绿' },
                        { code: '#f59e0b', label: '预警黄' }
                      ].map(col => {
                        const isCurrent = (selectedDevice.color || '#3b82f6') === col.code;
                        return (
                          <button
                            key={col.code}
                            type="button"
                            className={`context-color-ball ${isCurrent ? 'active' : ''}`}
                            style={{ 
                              backgroundColor: col.code,
                              width: '20px',
                              height: '20px',
                              border: isCurrent ? '2px solid #fff' : '2px solid transparent',
                              borderRadius: '50%',
                              cursor: 'pointer',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}
                            title={col.label}
                            onClick={() => onUpdateDevice(selectedDevice.id, { color: col.code })}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* 新增：设备所属房间/区域分配 (使用高保真行内输入，杜绝弹窗拦截) */}
                  <div className="form-group" style={{ marginTop: '12px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      {t('roomLabel')}
                    </label>
                    <select
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        fontSize: '12px',
                        background: 'rgba(15,23,42,0.8)',
                        border: '1px solid var(--border-color)',
                        color: '#fff',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        marginBottom: '8px'
                      }}
                      value={selectedDevice.room || '未分配'}
                      onChange={(e) => onUpdateDevice(selectedDevice.id, { room: e.target.value })}
                    >
                      {existingRooms.map(rm => (
                        <option key={rm} value={rm}>{rm}</option>
                      ))}
                    </select>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        placeholder={t('addRoomPlaceholder')}
                        id="new-room-input"
                        style={{
                          flex: 1,
                          padding: '5px 8px',
                          fontSize: '12px',
                          background: 'rgba(0,0,0,0.25)',
                          border: '1px solid var(--border-color)',
                          color: '#fff',
                          borderRadius: '6px',
                          boxSizing: 'border-box'
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = e.target.value.trim();
                            if (val) {
                              onUpdateDevice(selectedDevice.id, { room: val });
                              e.target.value = '';
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0 10px', height: '28px', fontSize: '12px', whiteSpace: 'nowrap' }}
                        onClick={() => {
                          const inputEl = document.getElementById('new-room-input');
                          const val = inputEl ? inputEl.value.trim() : '';
                          if (val) {
                            onUpdateDevice(selectedDevice.id, { room: val });
                            inputEl.value = '';
                          }
                        }}
                      >
                        {t('addBtn')}
                      </button>
                    </div>
                  </div>

                  {/* 圆形感应范围 (人体传感器/烟感) */}
                  <div className="form-group" style={{ marginTop: '12px', marginBottom: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px' }}>
                      <input
                        type="checkbox"
                        checked={!!selectedDevice.showCircleFov}
                        onChange={(e) => onUpdateDevice(selectedDevice.id, { showCircleFov: e.target.checked })}
                      />
                      <span style={{ fontWeight: 500 }}>开启圆形感应范围 (人体/烟感)</span>
                    </label>
                  </div>

                  {selectedDevice.showCircleFov && (
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      {/* 感应覆盖半径 Slider */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
                          <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>圆形覆盖半径 (大小)</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <input
                              type="number"
                              min="30"
                              max="400"
                              style={{
                                width: '56px',
                                padding: '2px 4px',
                                fontSize: '11.5px',
                                background: 'rgba(0,0,0,0.25)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--color-primary)',
                                fontWeight: 600,
                                borderRadius: '4px',
                                textAlign: 'right'
                              }}
                              value={selectedDevice.circleFovRange || 120}
                              onChange={(e) => {
                                const val = Math.max(30, Math.min(400, parseInt(e.target.value) || 0));
                                onUpdateDevice(selectedDevice.id, { circleFovRange: val });
                              }}
                            />
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>px</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="30"
                          max="400"
                          step="5"
                          style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                          value={selectedDevice.circleFovRange || 120}
                          onChange={(e) => onUpdateDevice(selectedDevice.id, { circleFovRange: parseInt(e.target.value) || 120 })}
                        />
                      </div>

                      {/* 圆形阴影颜色选择 (在未开启伞形雷达时渲染以防冗余) */}
                      {!selectedDevice.showFov && (
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                            感应阴影投光颜色
                          </label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {[
                              { code: '#3b82f6', label: '科技蓝' },
                              { code: '#ef4444', label: '安防红' },
                              { code: '#10b981', label: '安全绿' },
                              { code: '#f59e0b', label: '预警黄' }
                            ].map(col => {
                              const isCurrent = (selectedDevice.fovColor || selectedDevice.color || '#3b82f6') === col.code;
                              return (
                                <button
                                  key={col.code}
                                  type="button"
                                  className={`context-color-ball ${isCurrent ? 'active' : ''}`}
                                  style={{ 
                                    backgroundColor: col.code,
                                    width: '20px',
                                    height: '20px',
                                    border: isCurrent ? '2px solid #fff' : '2px solid transparent'
                                  }}
                                  title={col.label}
                                  onClick={() => onUpdateDevice(selectedDevice.id, { fovColor: col.code })}
                                />
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 雷达可视视角与半径调试模块 */}
                  <div className="form-group" style={{ marginTop: '12px', marginBottom: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px' }}>
                      <input
                        type="checkbox"
                        checked={!!selectedDevice.showFov}
                        onChange={(e) => onUpdateDevice(selectedDevice.id, { showFov: e.target.checked })}
                      />
                      <span style={{ fontWeight: 500 }}>开启监控可视范围 (雷达伞形)</span>
                    </label>
                  </div>

                  {selectedDevice.showFov && (
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      {/* 新增双向镜面雷达 Checkbox */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                          <input
                            type="checkbox"
                            checked={!!selectedDevice.showDoubleFov}
                            onChange={(e) => onUpdateDevice(selectedDevice.id, { showDoubleFov: e.target.checked })}
                          />
                          <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>开启双向防护系统 (对称镜面)</span>
                        </label>
                      </div>

                      {/* 可视半径 Slider */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
                          <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>监控视角半径 (远近)</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <input
                              type="number"
                              min="50"
                              max="400"
                              style={{
                                width: '56px',
                                padding: '2px 4px',
                                fontSize: '11.5px',
                                background: 'rgba(0,0,0,0.25)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--color-primary)',
                                fontWeight: 600,
                                borderRadius: '4px',
                                textAlign: 'right'
                              }}
                              value={selectedDevice.fovRange || 160}
                              onChange={(e) => {
                                const val = Math.max(50, Math.min(400, parseInt(e.target.value) || 0));
                                onUpdateDevice(selectedDevice.id, { fovRange: val });
                              }}
                            />
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>px</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="400"
                          step="5"
                          style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                          value={selectedDevice.fovRange || 160}
                          onChange={(e) => onUpdateDevice(selectedDevice.id, { fovRange: parseInt(e.target.value) || 160 })}
                        />
                      </div>

                      {/* 可视夹角 Slider */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
                          <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>监控视角夹角 (宽度)</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <input
                              type="number"
                              min="1"
                              max="180"
                              style={{
                                width: '56px',
                                padding: '2px 4px',
                                fontSize: '11.5px',
                                background: 'rgba(0,0,0,0.25)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--color-primary)',
                                fontWeight: 600,
                                borderRadius: '4px',
                                textAlign: 'right'
                              }}
                              value={selectedDevice.fovAngle || 80}
                              onChange={(e) => {
                                const val = Math.max(1, Math.min(180, parseInt(e.target.value) || 0));
                                onUpdateDevice(selectedDevice.id, { fovAngle: val });
                              }}
                            />
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>°</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="180"
                          step="1"
                          style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                          value={selectedDevice.fovAngle || 80}
                          onChange={(e) => onUpdateDevice(selectedDevice.id, { fovAngle: parseInt(e.target.value) || 80 })}
                        />
                      </div>

                      {/* 雷达照射方向 Slider 与重置按钮 */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
                          <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>雷达照射方向 (旋转)</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="number"
                              min="0"
                              max="360"
                              style={{
                                width: '56px',
                                padding: '2px 4px',
                                fontSize: '11.5px',
                                background: 'rgba(0,0,0,0.25)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--color-primary)',
                                fontWeight: 600,
                                borderRadius: '4px',
                                textAlign: 'right'
                              }}
                              value={selectedDevice.fovRotation !== undefined ? selectedDevice.fovRotation : (selectedDevice.rotation || 0)}
                              onChange={(e) => {
                                const val = Math.max(0, Math.min(360, parseInt(e.target.value) || 0));
                                onUpdateDevice(selectedDevice.id, { fovRotation: val });
                              }}
                            />
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>°</span>
                            {selectedDevice.fovRotation !== undefined && (
                              <button
                                type="button"
                                style={{
                                  background: 'rgba(255,255,255,0.06)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  color: 'var(--text-muted)',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '9.5px',
                                  cursor: 'pointer'
                                }}
                                onClick={() => onUpdateDevice(selectedDevice.id, { fovRotation: undefined })}
                                title="点击重置为与产品一致的方向"
                              >
                                与产品对齐
                              </button>
                            )}
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          step="1"
                          style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                          value={selectedDevice.fovRotation !== undefined ? selectedDevice.fovRotation : (selectedDevice.rotation || 0)}
                          onChange={(e) => onUpdateDevice(selectedDevice.id, { fovRotation: parseInt(e.target.value) || 0 })}
                        />
                      </div>

                      {/* 雷达独立阴影颜色选择 */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                          雷达阴影投光颜色
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {[
                            { code: '#3b82f6', label: '科技蓝' },
                            { code: '#ef4444', label: '安防红' },
                            { code: '#10b981', label: '安全绿' },
                            { code: '#f59e0b', label: '预警黄' }
                          ].map(col => {
                            const isCurrent = (selectedDevice.fovColor || selectedDevice.color || '#3b82f6') === col.code;
                            return (
                              <button
                                key={col.code}
                                type="button"
                                className={`context-color-ball ${isCurrent ? 'active' : ''}`}
                                style={{ 
                                  backgroundColor: col.code,
                                  width: '20px',
                                  height: '20px',
                                  border: isCurrent ? '2px solid #fff' : '2px solid transparent'
                                }}
                                title={col.label}
                                onClick={() => onUpdateDevice(selectedDevice.id, { fovColor: col.code })}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    className="btn btn-danger"
                    style={{ width: '100%', marginTop: '10px' }}
                    onClick={() => onDeleteElement(selectedDevice.id, 'device')}
                  >
                    <Trash2 size={13} /> 删除此设备
                  </button>
                </div>
              ) : selectedWire ? (
                <div className="form-container">
                  <div className="form-group">
                    <label>线路类型</label>
                    <select
                      className="form-control"
                      style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '6px', cursor: 'pointer' }}
                      value={selectedWire.type}
                      onChange={(e) => {
                        const newType = e.target.value;
                        let newColor = '#ef4444';
                        if (newType === 'neutral') newColor = '#3b82f6';
                        else if (newType === 'live-neutral') newColor = '#f59e0b';
                        else if (newType === 'knx') newColor = '#10b981';
                        else if (newType === 'network') newColor = '#eab308';
                        onUpdateWire(selectedWire.id, { type: newType, color: newColor });
                      }}
                    >
                      <option value="live">火线 (红色实线)</option>
                      <option value="neutral">零线 (蓝色虚线)</option>
                      <option value="live-neutral">零火并列 (红蓝并排)</option>
                      <option value="knx">KNX 总线 (绿色粗线)</option>
                      <option value="network">网线 (黄色粗线)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>线缆颜色</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span 
                        className="color-dot" 
                        style={{ 
                          backgroundColor: selectedWire.color,
                          border: selectedWire.type === 'neutral' ? '1px dashed #ffffff' : 'none' 
                        }} 
                      />
                      <span style={{ fontSize: '13px' }}>
                        {selectedWire.type === 'live' && '红色 (#ef4444)'}
                        {selectedWire.type === 'neutral' && '蓝色 (#3b82f6)'}
                        {selectedWire.type === 'live-neutral' && '红蓝双色并排'}
                        {selectedWire.type === 'knx' && '绿色 (#10b981)'}
                        {selectedWire.type === 'network' && '黄色 (#eab308)'}
                      </span>
                    </div>
                  </div>
                  <button
                    className="btn btn-danger"
                    style={{ width: '100%', marginTop: '10px' }}
                    onClick={() => onDeleteElement(selectedWire.id, 'wire')}
                  >
                    <Trash2 size={13} /> 删除此线路
                  </button>
                </div>
              ) : (
                <div className="empty-state">
                  <ShieldAlert size={18} />
                  <p>在画布上选择任意设备或线路，即可在此编辑其属性参数。</p>
                </div>
              )}
              </div>
              <div 
                className="section-height-resizer" 
                onMouseDown={(e) => handleSectionResizeStart(e, 'props')}
              />
            </div>
          )}
        </div>

        {/* 2. 产品清单与统计区 */}
        <div className="section-container">
          <div 
            className="section-title-clickable"
            onClick={() => setIsListOpen(!isListOpen)}
            title="点击展开或收起"
          >
            <span>全屋产品统计 ({devices.length}件)</span>
            {isListOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
          
          {isListOpen && (
            <div 
              className="section-content-wrapper" 
              style={{ height: listHeight ? `${listHeight}px` : 'auto', display: 'flex', flexDirection: 'column', position: 'relative', paddingBottom: '6px' }}
            >
              <div className="section-content-scroll" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              {deviceStats.length === 0 ? (
                <div className="empty-state">
                  <p>暂无产品。请从左侧拖动或点击添加设备。</p>
                </div>
              ) : (
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    marginBottom: '10px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <AlertCircle size={12} style={{ color: 'var(--color-primary)' }} />
                    <span>{lang === 'zh' ? '增减数量或删除操作将直接作用于当前' : 'Modifying quantity or deleting will directly affect current'} <b>「{activeTabName}」</b> {lang === 'zh' ? '画布。' : 'canvas.'}</span>
                  </div>

                  <div className="quote-table-container">
                    <table className="quote-table">
                      <thead>
                        <tr>
                          <th>{lang === 'zh' ? '产品/型号' : 'Product/Model'}</th>
                          <th style={{ width: '110px' }}>{lang === 'zh' ? '数量' : 'Qty'}</th>
                          <th>{lang === 'zh' ? '小计' : 'Subtotal'}</th>
                          <th style={{ width: '32px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {deviceStats.map((item, index) => (
                          <tr key={index}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {/* 循环定位瞄准按钮 */}
                                <button
                                  type="button"
                                  className="focus-aim-btn"
                                  title={lang === 'zh' ? '在图纸中循环定位并高亮此设备' : 'Locate and highlight this device on drawing'}
                                  onClick={() => onFocusDeviceModel && onFocusDeviceModel(item.model)}
                                >
                                  <Compass size={12} />
                                </button>
                                <div>
                                  <div style={{ fontWeight: 500 }}>{item.name}</div>
                                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.model}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              {/* 加减数量控件 */}
                              <div className="quantity-adjuster">
                                <button 
                                  className="quantity-btn"
                                  onClick={() => onChangeDeviceCount(item.model, Math.max(0, item.count - 1))}
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  className="quantity-input"
                                  value={item.count}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    onChangeDeviceCount(item.model, Math.max(0, val));
                                  }}
                                  min="0"
                                />
                                <button 
                                  className="quantity-btn"
                                  onClick={() => onChangeDeviceCount(item.model, item.count + 1)}
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="price-val">RM {item.price * item.count}</td>
                            <td>
                              {/* 一键删除该型号 */}
                              <button
                                className="trash-btn"
                                onClick={() => onDeleteDeviceGroup(item.model)}
                                title="清空该型号的设备"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              </div>
              <div 
                className="section-height-resizer" 
                onMouseDown={(e) => handleSectionResizeStart(e, 'list')}
              />
            </div>
          )}
        </div>

        {/* 3. 结算统计区 */}
        <div className="section-container">
          <div 
            className="section-title-clickable"
            onClick={() => setIsSummaryOpen(!isSummaryOpen)}
            title="点击展开或收起"
          >
            <span>工程结算汇总</span>
            {isSummaryOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
          
          {isSummaryOpen && (
            <div 
              className="section-content-wrapper" 
              style={{ height: summaryHeight ? `${summaryHeight}px` : 'auto', display: 'flex', flexDirection: 'column', position: 'relative', paddingBottom: '6px' }}
            >
              <div className="section-content-scroll" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              <div className="quote-summary-card">
                <div className="quote-row">
                  <span>{t('devicesSubtotal')}</span>
                  <span className="price-val">RM {devicesTotal.toFixed(2)}</span>
                </div>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <div className="quote-row">
                    <span>{lang === 'zh' ? '工本费比例 (%)' : 'Labor Rate (%)'}</span>
                    <input
                      id="input-labor-rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      className="form-control"
                      style={{ 
                        width: '100px', 
                        padding: '4px 8px', 
                        fontSize: '12px',
                        color: extraCosts.labor === '' ? 'var(--text-muted)' : 'var(--text-main)'
                      }}
                      value={inputLaborRate}
                      onFocus={(e) => e.target.select()}
                      onBlur={() => handleBlur('laborRate')}
                      onChange={(e) => {
                        const valStr = e.target.value;
                        setInputLaborRate(valStr);
                        if (valStr === '') {
                          onUpdateExtraCosts('labor', '');
                          setInputLabor('');
                        } else {
                          const val = parseFloat(valStr);
                          if (!isNaN(val)) {
                            const newLabor = Number((devicesTotal * val / 100).toFixed(2));
                            onUpdateExtraCosts('labor', newLabor);
                            setInputLabor(String(newLabor));
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: '6px 0 0 0' }}>
                  <div className="quote-row">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {t('laborCost')}
                      {extraCosts.labor !== '' && (
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateExtraCosts('labor', '');
                            setInputLabor('');
                            setInputLaborRate('15');
                          }}
                          style={{
                            background: 'rgba(59, 130, 246, 0.15)',
                            border: 'none',
                            color: '#60a5fa',
                            fontSize: '9px',
                            padding: '2px 5px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}
                          title={lang === 'zh' ? '恢复按 15% 比例自动联动' : 'Restore 15% auto calculation'}
                        >
                          {lang === 'zh' ? '重置联动' : 'Reset'}
                        </button>
                      )}
                    </span>
                    <input
                      id="input-labor"
                      type="number"
                      step="0.01"
                      className="form-control"
                      style={{ 
                        width: '100px', 
                        padding: '4px 8px', 
                        fontSize: '12px',
                        borderColor: extraCosts.labor !== '' ? '#3b82f6' : 'var(--border-color)',
                        color: extraCosts.labor !== '' ? '#60a5fa' : 'var(--text-muted)'
                      }}
                      placeholder={`${laborCost.toFixed(2)} (${lang === 'zh' ? '自动' : 'Auto'})`}
                      value={inputLabor}
                      onFocus={(e) => e.target.select()}
                      onBlur={() => handleBlur('labor')}
                      onChange={(e) => {
                        const valStr = e.target.value;
                        setInputLabor(valStr);
                        if (valStr === '') {
                          onUpdateExtraCosts('labor', '');
                          setInputLaborRate('15');
                        } else {
                          const val = parseFloat(valStr);
                          if (!isNaN(val)) {
                            onUpdateExtraCosts('labor', val);
                            const newRate = devicesTotal === 0 ? 0 : Number(((val / devicesTotal) * 100).toFixed(2));
                            setInputLaborRate(String(newRate));
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: '6px 0 0 0' }}>
                  <div className="quote-row">
                    <span>{lang === 'zh' ? '整单折让百分比 (%)' : 'Discount Rate (%)'}</span>
                    <input
                      id="input-discount"
                      type="number"
                      min="0"
                      max="100"
                      className="form-control"
                      style={{ width: '100px', padding: '4px 8px', fontSize: '12px' }}
                      placeholder={lang === 'zh' ? '0 (无折让)' : '0 (No discount)'}
                      value={inputDiscount}
                      onFocus={(e) => e.target.select()}
                      onBlur={() => handleBlur('discount')}
                      onChange={(e) => {
                        const valStr = e.target.value;
                        setInputDiscount(valStr);
                        if (valStr === '') {
                          onUpdateExtraCosts('discount', '');
                        } else {
                          const val = parseFloat(valStr);
                          if (!isNaN(val)) {
                            const capped = Math.max(0, Math.min(100, val));
                            onUpdateExtraCosts('discount', capped);
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="quote-row total">
                  <span>{t('totalQuote')}</span>
                  <span className="price-val">RM {finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* 新增：按房间区域硬件预算汇总卡片 */}
              {devices.length > 0 && (
                <div className="quote-summary-card" style={{ marginTop: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--color-primary)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '4px', marginBottom: '8px' }}>
                    {t('roomStatsTitle')}
                  </div>
                  {roomBudgetStats.map(stat => {
                    const roomName = stat.room === '未分配' ? t('unassigned') : stat.room;
                    return (
                      <div className="quote-row" key={stat.room} style={{ fontSize: '11px', minHeight: '22px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{roomName} <span style={{ fontSize: '9.5px', opacity: 0.6 }}>({stat.count} {lang === 'zh' ? '件设备' : 'items'})</span></span>
                        <span style={{ fontWeight: 600, color: '#f59e0b' }}>RM {stat.total.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              </div>
              <div 
                className="section-height-resizer" 
                onMouseDown={(e) => handleSectionResizeStart(e, 'summary')}
              />
            </div>
          )}
        </div>

      </div>
    </aside>
  );
}
