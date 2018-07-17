//油耗管理--加油查询

import moment from 'moment';
import {message} from 'antd';
import { getBaicPostData} from '../utils/util';
import { getCarTypeSelect, getCarCodeTree, getRefuelList, getDepartTree, getRefuelPoints,getOilLine} from '../services/oilManage';
export default{
    namespace:'refuelList',
    state:{
        company:'',//作业单位
        companyTree:[],//作业单位结构树
        carClassesCode:'',//车辆类型
        carClassesSelect:[],//车辆类型下拉
        carCode:'',//车牌号
        carCodeTree:[],//车牌号结构树
        startDate:moment().subtract(1,'days').format('YYYY-MM-DD'),
        endDate: moment().format('YYYY-MM-DD'),
        tableData:[],
        currentPage:1,
        pageSize:10,
        totalItems:0,
        loading:false,
        mapType:'bmap',//地图类型
        wkid: '4326',//坐标系编号与mapServer的wkid
        mapServer: {//只有arcgis需要 gis服务

        },
        setVisiblePoints:false,
        detail:{
            oilLineData:{},//油耗曲线
            refuelPointData:[],//加油点
            oilLineData2:{},//隔夜加油时第二个油耗曲线
        },
        detailLoading:false,
    },
    reducers:{
        updateState(state, action) {
            return { ...state, ...action.payload };
        },
        updateDetail(state,action){
            return {
                ...state,
                detail:{
                    ...state.detail,
                    ...action.payload,
                }
            }
        }
    },
    effects:{
        //获取车辆类型下拉框
        *getCarTypeSelect({payload},{call,put,select}){
            const {data} = yield call(getCarTypeSelect,getBaicPostData({}));
            if(data&&data.result===0){
                yield put({
                    type:'updateState',
                    payload:{
                        carClassesSelect:data.data.data
                    }
                })
            }
        },
        //获取作业单位结构树
        *getCompanyTree({ payload }, { call, put, select }) {
            const { data } = yield call(getDepartTree, getBaicPostData({}));
            
            if (data && data.result === 0 && Array.isArray(data.data.data.items)) {
                const treeProcessor = new companyTreeDataProcessor(data.data.data.items);
                yield put({
                    type: 'updateState',
                    payload: {
                        companyTree: treeProcessor.getNewTree()
                    }
                })
            }
        },
        //获取车牌号结构树
        *getCarCodeTree({ payload }, { call, put, select }) {
            const {company,carClassesCode} = yield select(({refuelList}) => refuelList);
            const { data } = yield call(getCarCodeTree, getBaicPostData({
                carClassCode:carClassesCode,
                companyId:company
            }));
            if (data && data.result === 0 && Array.isArray(data.data.data.items)) {
                const carProcessor = new carTreeDataProcessor(data.data.data.items)
                yield put({
                    type: 'updateState',
                    payload: {
                        carCodeTree: carProcessor.getNewTree()
                    }
                })
            }
        },
        //获取表格数据
        *getTableData({payload},{call,put,select}){
            const {company,carClassesCode,carCode,startDate,endDate,pageSize,currentPage} = yield select(({refuelList})=>refuelList)
            yield put({
                type:'updateState',
                payload:{
                    loading:true
                }
            })
            const { data } = yield call(getRefuelList,getBaicPostData({
                carId:carCode,
                carClassesCode:carClassesCode,
                companyId:company,
                startTime:startDate,
                endTime:endDate,
                page:currentPage,
                rows:pageSize
            }))
            yield put({
                type: 'updateState',
                payload: {
                    loading: false
                }
            })
            if(data&&data.result===0){
                yield put({
                    type:'updateState',
                    payload:{
                        tableData:data.data.data.rows,
                        totalItems:data.data.data.total
                    }
                })
            }
        },
        //正常加油查询详情
        *getNormalDetail({payload},{call,put,select}){
            const {carId,startTime,endTime,} = payload;
            const {mapType} = yield select(({refuelList}) => refuelList);
            //设置加载状态--开始加载
            yield put({
                type: 'updateState',
                payload: {
                    detailLoading: true
                }
            })
            //获取油耗数据
            const oilLineData = yield call(getOilLine,getBaicPostData({
                carId,
                startTime:moment(startTime).format('YYYY-MM-DD 00:00:00'),
                endTime: moment(endTime).format('YYYY-MM-DD 23:59:59'),
                mapType
            }))
            if(oilLineData.data&&oilLineData.data.result==0){
                const oilLineResult = oilLineData.data.data.data||{};
                yield put({
                    type:'updateDetail',
                    payload:{
                        oilLineData:oilLineResult
                    }
                })
                if (oilLineResult.oilLine.length === 0) {
                    message.warn(oilLineResult.isNullDataMsg)
                }
            }else{
                message.warn(oilLineData.data.msg||'加载油耗曲线失败')
            }
            //获取加油点数据
            const refuelPointData = yield call(getRefuelPoints, getBaicPostData({
                carId,
                startTime,
                endTime,
                mapType
            }))
            if(refuelPointData.data&&refuelPointData.data.result==0){
                const refuelPointResult = refuelPointData.data.data.data || {};
                yield put({
                    type: 'updateDetail',
                    payload: {
                        refuelPointData: refuelPointResult
                    }
                })
            }else{
                message.warn(refuelPointData.data.msg||'加载加油点曲线失败')
            }
            //设置地图展示点的参数
            yield put({
                type: 'updateState',
                payload: {
                    setVisiblePoints: true,
                }
            })

            yield call(delay, 1);

            yield put({
                type: 'updateState',
                payload: {
                    setVisiblePoints: false
                }
            })
            //修改加载状态--结束加载
            yield put({
                type: 'updateState',
                payload: {
                    detailLoading: false
                }
            })
        },
        //隔夜加油查询详情
        *getAbnormalDetail({ payload }, { call, put, select }) {
            const { carId, startTime, endTime, } = payload;
            const { mapType } = yield select(({ refuelList }) => refuelList);
            //设置加载状态--开始加载
            yield put({
                type: 'updateState',
                payload: {
                    detailLoading: true
                }
            })
            //获取第一天油耗数据
            const oilLineData = yield call(getOilLine, getBaicPostData({
                carId,
                startTime: moment(startTime).format('YYYY-MM-DD 00:00:00'),
                endTime: moment(startTime).format('YYYY-MM-DD 23:59:59'),
                mapType
            }))
            if (oilLineData.data && oilLineData.data.result == 0) {
                const oilLineResult = oilLineData.data.data.data || {};
                yield put({
                    type: 'updateDetail',
                    payload: {
                        oilLineData: oilLineResult
                    }
                })
                if (oilLineResult.oilLine.length === 0) {
                    message.warn(oilLineResult.isNullDataMsg)
                }
            } else {
                message.warn(oilLineData.data.msg || '加载油耗曲线失败')
            }
            //获取第二条天油耗数据
            const oilLineData2 = yield call(getOilLine, getBaicPostData({
                carId,
                startTime: moment(endTime).format('YYYY-MM-DD 00:00:00'),
                endTime: moment(endTime).format('YYYY-MM-DD 23:59:59'),
                mapType
            }))
            if (oilLineData2.data && oilLineData2.data.result == 0) {
                const oilLineResult2 = oilLineData2.data.data.data || {};
                yield put({
                    type: 'updateDetail',
                    payload: {
                        oilLineData2: oilLineResult2
                    }
                })
                if (oilLineResult2.oilLine.length === 0) {
                    message.warn(oilLineResult2.isNullDataMsg)
                }
            } else {
                message.warn(oilLineData2.data.msg || '加载油耗曲线失败')
            }
            //修改加载状态--结束加载
            yield put({
                type: 'updateState',
                payload: {
                    detailLoading: false
                }
            })
        },
        
    },
    subscriptions:{
        setup({ dispatch, history }) {
            // dispatch({type:'fetchRemote'})
            history.listen(({ pathname }) => {
                if (pathname === '/refuelList') {
                    dispatch({ type: 'getCarTypeSelect' });
                    dispatch({ type: 'getCompanyTree' });
                    dispatch({ type: 'getCarCodeTree' });
                    dispatch({ type:'getTableData'});
                }
            });
        },
    }
}
//处理作业单位树节点
class companyTreeDataProcessor {
    constructor(rawData) {
        this.newTree = this.generateNewTree(rawData)
    }
    generateNewTree(rawData) {
        return rawData.map((item, index) => {
            if (Array.isArray(item.children) && item.children.length > 0) {
                return {
                    key: item.id,
                    value: item.id,
                    label: item.name,
                    isLeaf: item.leaf,
                    children: this.generateNewTree(item.children),
                    disabled: item.nodeType == 'Root'
                }
            } else {
                return {
                    key: item.id,
                    value: item.id,
                    label: item.name,
                    isLeaf: item.leaf,
                    disabled: item.nodeType == 'Root'
                }
            }
        })
    }
    getNewTree() {
        return this.newTree;
    }
}
//处理车辆树节点
class carTreeDataProcessor{
    constructor(rawData){
        this.newTree=this.generateNewTree(rawData)
    }
    generateNewTree(rawData){
        return rawData.map((item,index)=>{
            if(Array.isArray(item.children)&&item.children.length>0){
                return {
                    key:item.id,
                    value:item.id,
                    label:item.name,
                    isLeaf:item.leaf,
                    children:this.generateNewTree(item.children),
                    disabled: item.nodeType != 'car'
                }
            }else{
                return {
                    key: item.id,
                    value: item.id,
                    label: item.name,
                    isLeaf: item.leaf,
                    disabled: item.nodeType != 'car'
                }
            }
        })
    }
    getNewTree(){
        return this.newTree;
    }
}
function delay(time) {
    return new Promise((resolve) => {
        setTimeout(() => { resolve() }, time);
    })
}