import request from '../utils/request';

//获取租户信息
export function getInfoByTenantId(param) {
    return request('/cloud/management/rest/np/tenant/getTenantById', {
        method: 'post',
        body: param
    })
}