import request from '../utils/request';

// 导出历史轨迹数据
export function getExportHistoryDataURL({carId,startTime,endTime}){
    return `/cloud/gps/api/np/v2/position/exportHisPositions.smvc?carId=${carId}&startTime=${startTime}&endTime=${endTime}`;
}

// 获取车辆分段时间区间（已废弃）
export function getCarTimePeriodIFS(postData) {
    return request('/cloud/gps/api/np/v2/position/querySubTracks.smvc',{
        body:postData
    });
}
// 获取车辆历史点位
export function getHistoryPositionIFS(postData) {
    return request('/cloud/gps/api/np/v2/position/queryHisPositionList.smvc',{
        body:postData
    });
}

// 停车分析
export function getCarStopPositionIFS(postData) {
    return request('/cloud/gps/api/np/v2/position/queryStopList.smvc',{
        body:postData
    });
}

// 速度分析曲线
export function getCarSpeedLineIFS(postData) {
    return request('/cloud/gps/api/np/v2/position/querySpeedList.smvc',{
        body:postData
    });
}

// 根据框选区域查询树
export function getTreeDataByAreaIFS(postData) {
    return request('/cloud/gps/api/np/v2/tree/getPositionByShape.smvc',{
        body:postData
    });
}

// 获取加油点
export function getRefuelingPointIFS(postData) {
    return request('/cloud/gps/api/np/v2/oil/getAddOilPoints.smvc',{
        body:postData
    });
}

// 获取异常点
export function getAbnormalPointIFS(postData) {
    return request('/cloud/gps/api/np/v2/oil/getExceptionPoint.smvc',{
        body:postData
    });
}