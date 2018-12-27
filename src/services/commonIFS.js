import request from '../utils/request';
import { getBaicPostData } from '../utils/util';

//获取租户信息
export function getInfoByTenantId(param) {
    return request('/cloud/management/rest/np/tenant/getTenantById', {
        method: 'post',
        body: param
    })
}
//获取区域
export async function getAreas(param=getBaicPostData({shapeTypes:'polygon,rectangle'})){
    return request('/cloud/gps/api/np/v101/workElement/getWorkElementsByShapes.smvc',{
        method: 'post',
        body:{parameters:JSON.stringify(param)},
    })
}
//获取路线
export async function getRoutes(param=getBaicPostData({shapeTypes:'line'})){
    return request('/cloud/gps/api/np/v101/workElement/getWorkElementsByShapes.smvc',{
        method: 'post',
        body:{parameters:JSON.stringify(param)},
    })
}
// 获取车辆机构树
export function getCarOrgTreeIFS(postData) {
  return request('/cloud/gps/api/np/v2/tree/loadOrgCarTree.smvc',{
      body:postData
  });
}
//获取报警等级
export async function getAlarmTypeLevelList(param){
    return request('/cloud/gps/alarm/rest/alarmLevel/queryList.smvc',{
        method: 'post',
        body: {parameters:JSON.stringify(param)},
    })
}
//获取权限
export async function getFunctionList(param){
    return request('/cloud/gps/api/np/v101/common/getFunctionList.smvc',{
        method: 'post',
        body: {parameters:JSON.stringify(param)},
    })
}
//获取排班时间段列表
export async function getTimeList(param){
    return request('/cloud/gps/api/np/v101/alarmInfo/time/list.smvc',{
        method: 'post',
        body: {parameters:JSON.stringify(param)},
    })
}