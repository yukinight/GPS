//油耗管理
import request from '../utils/requestJsonp';

/* ==================加油查询========================== */
//获取作业单位结构树
export async function getDepartTree(param) {
    return request('/oilManage/cloud/oil/api/np/v101/common/loadDepartTree.smvc', {
        method: 'get',
        body: { parameters: JSON.stringify(param) },
    })
}
//获取车辆类型
export async function getCarTypeSelect(param) {
    return request('/oilManage/cloud/oil/api/np/v101/common/loadCarClasses.smvc', {
        method: 'get',
        body: { parameters: JSON.stringify(param) },
    })
}
//获取车牌号结构树
export async function getCarCodeTree(param) {
    return request('/oilManage/cloud/oil/api/np/v101/common/loadCarTree.smvc', {
        method: 'get',
        body: { parameters: JSON.stringify(param) },
    })
}
//获取加油管理列表
export async function getRefuelList(param) {
    return request('/oilManage/cloud/oil/api/np/v101/caraddoil/pageList.smvc', {
        method: 'get',
        body: { parameters: JSON.stringify(param) },
    })
}
//获取加油点
export async function getRefuelPoints(param) {
    return request('/oilManage/cloud/oil/api/np/v101/caraddoil/getAddOilPoints.smvc', {
        method: 'get',
        body: { parameters: JSON.stringify(param) },
    })
}
//获取油耗曲线
export async function getOilLine(param) {
    return request('/oilManage/cloud/oil/api/np/v101/carhistoryoil/getOilLine.smvc', {
        method: 'get',
        body: { parameters: JSON.stringify(param) },
    })
}
//获取油耗异常列表
export async function getOilExceptionList(param) {
    return request('/oilManage/cloud/oil/api/np/v101/carexception/pageList.smvc', {
        method: 'get',
        body: { parameters: JSON.stringify(param) },
    })
}
//获取异常点
export async function getExceptionPoints(param) {
    return request('/oilManage/cloud/oil/api/np/v101/caraddoil/getExceptionPoint.smvc', {
        method: 'get',
        body: { parameters: JSON.stringify(param) },
    })
}
//油耗异常处理
export async function handleException(param) {
    return request('/oilManage/cloud/oil/api/np/v101/carexception/update.smvc', {
        method: 'get',
        body: { parameters: JSON.stringify(param) },
    })
}
//加油站管理列表
export async function getGasStationList(param) {
    return request('/oilManage/cloud/oil/api/np/v101/carGasStation/pageList.smvc', {
        method: 'get',
        body: { parameters: JSON.stringify(param) },
    })
}
//编号验重
export async function checkForm(param) {
    return request('/oilManage/cloud/oil/api/np/v101/carGasStation/checkForm.smvc', {
        method: 'get',
        body: { parameters: JSON.stringify(param) },
    })
}
//提交加油站
export async function addStation(param) {
    return request('/oilManage/cloud/oil/api/np/v101/carGasStation/save.smvc', {
        method: 'get',
        body: { parameters: JSON.stringify(param) },
    })
}
//修改加油站
export async function updateStation(param) {
    return request('/oilManage/cloud/oil/api/np/v101/carGasStation/update.smvc', {
        method: 'get',
        body: { parameters: JSON.stringify(param) },
    })
}
//删除加油站
export async function deleteStation(param) {
    return request('/oilManage/cloud/oil/api/np/v101/carGasStation/deletes.smvc', {
        method: 'get',
        body: { parameters: JSON.stringify(param) },
    })
}