import u from 'updeep';
import {VtxUtil} from '../utils/util';
import {getInfoByTenantId} from '../services/commonIFS';
import _pickBy from 'lodash/pickBy';

const STATE = {
    updatedTime:null,  //获取数据时间
    mapType: 'bmap', //地图类型
    mapName:'百度地图', //地图中文名
    coordType: 'bd09', //地图坐标类型
    tenantPosition:null //租户配置的中心点
}

export default {

    namespace: 'common',

    state: u(STATE,null),

    subscriptions: {
        setup({ dispatch, history }) {
        },
    },

    effects: {
        *fetch({ payload }, { call, put, select }) {
            yield put({ type: 'save' });
        },
        *getTenantInfo({ payload }, { call, put, select }){
            const state = yield select(({common})=>common);
            // 多次调用只取一次
            if(state.updatedTime)return;

            const tenantId = VtxUtil.getUrlParam('tenantId');
            if(!tenantId){
                console.error('未能从URL取得tenantId')
                return;
            }
            const {data} = yield call(getInfoByTenantId,{
                parameters:JSON.stringify({id:tenantId})
            });
            if(data && data.data){
                let updatedObj = {};

                if(data.data.mapDefJson){
                    const mapDef = JSON.parse(data.data.mapDefJson);
                    const defaultCfg = mapDef.filter(item=>item.defaultMap).pop();

                    updatedObj.updatedTime = new Date().getTime();
                    updatedObj.mapType = defaultCfg.mapType;
                    updatedObj.coordType = defaultCfg.coordinate;
                    updatedObj.mapName = defaultCfg.mapName;
                }
                else{
                    console.warn('当前租户未定义地图类型');
                }

                if(data.data.longitudeDone && data.data.latitudeDone){
                    updatedObj.updatedTime = new Date().getTime();
                    updatedObj.tenantPosition = [data.data.longitudeDone,data.data.latitudeDone];
                }
                else{
                    console.warn('当前租户未定义中心点');
                }

                if(updatedObj.updatedTime){
                    yield put({
                        type:'updateState',
                        payload:updatedObj
                    })
                }
            }
            else{
                console.error('调用获取租户信息接口失败');
            }
        }
    },

    reducers: {
        updateState(state, action) {
            return u({ ...action.payload }, state);
        },
        resetState(state, action){
            return u(STATE,null);
        }
    },

};
