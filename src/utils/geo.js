/**
 * 几何计算与房间/设备位置联动工具类
 */

/**
 * 判断平面坐标点 (point) 是否位于多边形 (polygonPoints) 内部
 * @param {{x: number, y: number}} point 点坐标
 * @param {Array<{x: number, y: number}>} polygonPoints 多边形顶点数组
 * @returns {boolean}
 */
export const isPointInPolygon = (point, polygonPoints) => {
  if (!point || !polygonPoints || !Array.isArray(polygonPoints) || polygonPoints.length < 3) {
    return false;
  }
  let inside = false;
  for (let i = 0, j = polygonPoints.length - 1; i < polygonPoints.length; j = i++) {
    const xi = polygonPoints[i].x, yi = polygonPoints[i].y;
    const xj = polygonPoints[j].x, yj = polygonPoints[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

/**
 * 根据最新的房间多边形列表 (rooms)，重新同步和校验所有设备 (devices) 的房间/区域 (room) 分配
 * @param {Array} devices 设备数组
 * @param {Array} rooms 房间多边形数组
 * @returns {Array} 校验更新后的设备数组
 */
export const syncDeviceRooms = (devices = [], rooms = []) => {
  if (!Array.isArray(devices)) return [];
  
  return devices.map(dev => {
    // 1. 优先查找该设备实际几何坐标 (dev.x, dev.y) 所在的多边形房间
    const containingRoom = (rooms || []).find(r => r.points && isPointInPolygon({ x: dev.x, y: dev.y }, r.points));
    
    if (containingRoom) {
      // 落在多边形房间内部 -> 强制分配为该房间名称
      return dev.room === containingRoom.name ? dev : { ...dev, room: containingRoom.name };
    }
    
    // 2. 如果未落在任何已有房间多边形内：
    // 判断该设备当前绑定的 dev.room 是否在现存 rooms 列表中
    const currentRoomExists = (rooms || []).some(r => r.name === dev.room);
    
    // 如果其房间名称在现存 rooms 中已不存在（例如该房间被删除）或者有多边形但不在其中，归位重置为 '未分配'
    if (!currentRoomExists || (rooms && rooms.length > 0)) {
      return dev.room === '未分配' ? dev : { ...dev, room: '未分配' };
    }
    
    return dev;
  });
};
