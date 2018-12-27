import u from 'updeep';
import { getBaicPostData, VtxUtil } from '../utils/util';
import {isArray} from '../utils/alarmCrudUtil';
import {getInfoByTenantId,getFunctionList,getAlarmTypeLevelList,getTimeList} from '../services/commonIFS';
import _pickBy from 'lodash/pickBy';

const STATE = {
    updatedTime:null,  //获取数据时间
    mapType: 'bmap', //地图类型
    mapName:'百度地图', //地图中文名
    coordType: 'bd09', //地图坐标类型
    tenantPosition:null, //租户配置的中心点
    timeList:[],//排班时间列表
    UP_List:{
        R_CURD_BTN_ALARMLOG_LIST:true,
        R_CURD_BTN_ALARMLOG_UPDATE:true,
        R_CURD_BTN_OVERSPEED_ADD:true,
        R_CURD_BTN_OVERSPEED_LIST:true,
        R_CURD_BTN_OVERSPEED_UPDATE:true,
        R_CURD_BTN_OVERSPEED_DELETE:true,
        R_CURD_BTN_OVERTIME_ADD:true,
        R_CURD_BTN_OVERTIME_LIST:true,
        R_CURD_BTN_OVERTIME_UPDATE:true,
        R_CURD_BTN_OVERTIME_DELETE:true,
        R_CURD_BTN_OVERLINE_ADD:true,
        R_CURD_BTN_OVERLINE_LIST:true,
        R_CURD_BTN_OVERLINE_UPDATE:true,
        R_CURD_BTN_OVERLINE_DELETE:true,
        R_CURD_BTN_NOIN_ADD:true,
        R_CURD_BTN_NOIN_LIST:true,
        R_CURD_BTN_NOIN_UPDATE:true,
        R_CURD_BTN_NOIN_DELETE:true,
        R_CURD_BTN_NOOUT_ADD:true,
        R_CURD_BTN_NOOUT_LIST:true,
        R_CURD_BTN_NOOUT_UPDATE:true,
        R_CURD_BTN_NOOUT_DELETE:true,
        R_CURD_BTN_OVERSPEEDBZ_ADD:true,
        R_CURD_BTN_OVERSPEEDBZ_LIST:true,
        R_CURD_BTN_OVERSPEEDBZ_UPDATE:true,
        R_CURD_BTN_OVERSPEEDBZ_DELETE:true,
        R_CURD_BTN_OVERSPEEDBS_ADD:true,
        R_CURD_BTN_OVERSPEEDBS_LIST:true,
        R_CURD_BTN_OVERSPEEDBS_UPDATE:true,
        R_CURD_BTN_OVERSPEEDBS_DELETE:true,
        R_CURD_BTN_ALARMLEVEL_SAVE:true,
        R_CURD_BTN_CARSCHEDULER_ADD:true,
        R_CURD_BTN_CARSCHEDULER_LIST:true
    }
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
                    // acgis地图额外参数
                    if(defaultCfg.mapType=='gmap'){
                        updatedObj.mapServer = JSON.parse(defaultCfg.basicData);
                        updatedObj.minZoom = parseInt(defaultCfg.minZoom);
                        updatedObj.maxZoom = parseInt(defaultCfg.maxZoom);
                        updatedObj.wkid = defaultCfg.wkid;
                    }
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
        },
        //获取按钮权限
        *getFunctionList({payload},{call,put,select}){
            const {UP_List} = yield select(({common})=>common);
            const {data} =yield call(getFunctionList,getBaicPostData({
                userId:VtxUtil.getUrlParam('userId'),
                systemCode:VtxUtil.getUrlParam('systemCode')
            }))
            if(data){
                if (data.result===0) {
                    let newPermission={};
                    for(let x in UP_List){
                        let d;
                        d=data.data.data.filter((item)=>item.code==x);
                        if(d.length){
                            newPermission[x]=true;
                        }else{
                            newPermission[x]=false;
                        }
                    }
                    yield put({
                        type:'updateState',
                        payload:{
                            UP_List:newPermission
                        }
                    })
                }
            }
        },
        //获取排班列表
        *getTimeList({ payload }, { call, put,select }) {
            const state = yield select(({realTime})=>realTime);
            const {data} = state.bkCfg.isShifts?yield call(getTimeList,getBaicPostData()):'';
            if(data){
                if(!data.result){
                    yield put({
                        type:'updateState',
                        payload:{
                            timeList:isArray(data.data)?data.data:[]
                        }
                    })
                }
            }
        },
        //获取报警等级
        *getAlarmTypeLevelList({ payload }, { call, put, select }){
            const {data} = yield call(getAlarmTypeLevelList,getBaicPostData({
                alarmType:payload.alarmType
            }));
            if(data&&data.result===0){
                let list = isArray(data.data[`${payload.alarmType}`])?data.data[`${payload.alarmType}`]:[];
                yield put({
                    type:`${payload.model}/fetch`,
                    payload:{
                        alarmList:list.map((item)=>{
                            return{
                                key:item.id,
                                editMode:true,
                                ...item
                            }
                        }),
                        levelList:list.map((item)=>{
                            return{
                                key:item.id,
                                editMode:true,
                                ...item
                            }
                        })
                    }
                })
            }
        },
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
