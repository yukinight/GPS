import request from '../utils/request';

// 获取gps通用配置信息
export function getGPSConfigIFS(postData) {
  return request('/api/cloud/gps/api/np/v2/common/getGpsConstantSet.smvc',{
      body:postData
  });
}

// 获取车辆类型树
export function getCarTypeTreeIFS(postData) {
  return request('/api/cloud/gps/api/np/v2/tree/loadParamCarTree.smvc',{
      body:postData
  });
}

// 获取车辆机构树
export function getCarOrgTreeIFS(postData) {
  return request('/api/cloud/gps/api/np/v2/tree/loadOrgCarTree.smvc',{
      body:postData
  });
}

// 获取租户地图中心点
export function getTenantMapInfoIFS(postData) {
  return request('/api/cloud/gps/api/np/v2/common/getTenantInfo.smvc',{
      body:postData
  });
}

// 司机模糊搜索
export function driverFuzzySearchIFS(postData) {
  return request('/api/cloud/gps/api/np/v2/common/vagueMatchDriver.smvc',{
      body:postData
  });
}

// 车牌号模糊搜索
export function carFuzzySearchIFS(postData) {
  return request('/api/cloud/gps/api/np/v2/common/vagueMatchCarCode.smvc',{
      body:postData
  });
}

// 获取实时车辆数据
export function getCarsIFS(postData) {
  return request('/api/cloud/gps/api/np/v2/position/gpsLastPositions.smvc',{
      body:postData,
      method:'post'
  });
}

// LBS服务，根据经纬度取地址位置
export function getAddressByLngLatIFS(postData) {
  return request('/lbs/vortexapi/rest/lbs/geoconvert/v2',{
      body:postData
  });
}

// 获取报警信息
export function getAlarmInfoIFS(postData) {
  return request('/alarm/cloud/gps/alarm/api/np/v2/alarmInfo/queryAlarmInfoListByCarIds.smvc',{
      body:postData
  });
}
// 获取车辆油耗曲线
export function getCarOilLineIFS(postData) {
  return request('/api/cloud/gps/api/np/v2/oil/getOilLine.smvc',{
      body:postData
  });
}
// 单辆车实时跟踪==》丢弃，统一使用多车接口
export function trackOneCarRealTimeDataIFS(postData) {
  return request('/api/cloud/gps/api/np/v2/position/gpsLastPosition.smvc',{
      body:postData
  });
}
// 多车实时跟踪
export function trackMultiCarRealTimeDataIFS(postData) {
  return request('/api/cloud/gps/api/np/v2/position/gpsMultiLastPosition.smvc',{
      body:postData
  });
}

// 获取图元类型，查看关注区用
export function getFocusAreaListIFS(postData) {
  return request('/api/cloud/gps/api/np/v2/workElement/loadWorkElementType.smvc',{
      body:postData
  });
}

// 获取关注区具体数据
export function getFocusAreaDetailIFS(postData) {
  return request('/api/cloud/gps/api/np/v2/workElement/loadWorkElements.smvc',{
      body:postData
  });
}

// 车辆维修厂列表
export function getRepairShopListIFS(postData) {
  return request('/api/cloud/gps/api/np/v2/common/getAllCarShops.smvc',{
      body:postData
  });
}

// 加油站列表
export function getGasStationListIFS(postData) {
  return request('/api/cloud/gps/api/np/v2/common/getAllCarGasStation.smvc',{
      body:postData
  });
}

// 选中车辆汇总统计数据
export function getCarStatisticsIFS(postData) {
  return request('/api/cloud/gps/api/np/v2/common/loadRealtimeSummaryInfo.smvc',{
      body:postData
  });
}

// 调度信息接口
export function sendSchedulingMsgIFS(postData) {
  return request('/api/cloud/gps/api/np/v2/dispatch/msgSend.smvc',{
      body:postData
  });
}

// 获取视频id
export function getCarVideoInfoIFS(postData) {
  return request('/video/cloud/vis/api/np/v1/videoDevice/loadVideoChannelByBillId.smvc',{
      body:postData
  });
}

