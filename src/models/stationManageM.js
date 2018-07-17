//油耗管理 加油站管理
import { message } from 'antd';
import { getBaicPostData } from '../utils/util';
import { getGasStationList, checkForm, addStation, updateStation, deleteStation } from '../services/oilManage';
export default {
    namespace: 'stationManage',
    state:{
        name:'',
        tableData: [],
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        selectedRowKeys:[],
        loading: false,
        mapType: 'bmap',//地图类型
        wkid: '4326',//坐标系编号与mapServer的wkid
    },
    reducers: {
        updateState(state, action) {
            return { ...state, ...action.payload };
        },
        updateDetail(state, action) {
            return {
                ...state,
                detail: {
                    ...state.detail,
                    ...action.payload,
                }
            }
        }
    },
    effects:{
        *getTableData({ payload }, { call, put, select }) {
            const { name, pageSize, currentPage } = yield select(({ stationManage }) => stationManage);
            yield put({
                type: 'updateState',
                payload: {
                    loading: true
                }
            })
            const { data } = yield call(getGasStationList, getBaicPostData({
                name,
                page: currentPage,
                rows: pageSize
            }))
            yield put({
                type: 'updateState',
                payload: {
                    loading: false
                }
            })
            if (data && data.result === 0) {
                yield put({
                    type: 'updateState',
                    payload: {
                        tableData: data.data.data.rows,
                        totalItems: data.data.data.total
                    }
                })
            }
        },
        //验重
        *checkForm({payload},{call,put,select}){
            const {code,id} = payload;
            const {data} = yield call(checkForm,getBaicPostData({
                code,
                id
            }))
            if(data&&data.result===0){
                if(!data.data.data){//有重复
                    message.error('编号重复')
                }
            }
        },
        //新增
        *add({payload},{call,put,select}){
            const {code, name, address, longitudeDone, latitudeDone} = payload;
            //先验重
            yield put({
                type: 'updateState',
                payload: {
                    loading: true
                }
            })
            const checkFormResult = yield call(checkForm,getBaicPostData({
                code
            }))
            if(checkFormResult.data&&checkFormResult.data.result===0){
                if (!checkFormResult.data.data.data){
                    message.error('编号重复')
                    yield put({
                        type: 'updateState',
                        payload: {
                            loading: false
                        }
                    })
                }else{//正常提交
                    const {data} = yield call(addStation,getBaicPostData({
                        code,
                        name,
                        address,
                        longitudeDone,
                        latitudeDone
                    }))
                    yield put({
                        type: 'updateState',
                        payload: {
                            loading: false
                        }
                    })
                    if(data&&data.result===0){
                        message.success('保存成功')
                        yield put({type:'getTableData'})
                    }else{
                        message.error(data.exception||'新增出错')
                    }
                }
            }else{
                message.warn(checkFormResult.data.msg||'验重失败')
            }
        },
        //编辑
        *update({ payload }, { call, put, select }) {
            const { id,code, name, address, longitudeDone, latitudeDone } = payload;
            //先验重
            yield put({
                type: 'updateState',
                payload: {
                    loading: true
                }
            })
            const checkFormResult = yield call(checkForm, getBaicPostData({
                id,
                code
            }))
            if (checkFormResult.data && checkFormResult.data.result === 0) {
                if (!checkFormResult.data.data.data) {
                    message.error('编号重复')
                    yield put({
                        type: 'updateState',
                        payload: {
                            loading: false
                        }
                    })
                } else {//正常提交
                    const { data } = yield call(updateStation, getBaicPostData({
                        id,
                        code,
                        name,
                        address,
                        longitudeDone,
                        latitudeDone
                    }))
                    yield put({
                        type: 'updateState',
                        payload: {
                            loading: false
                        }
                    })
                    if (data && data.result === 0) {
                        message.success('修改成功')
                        yield put({ type: 'getTableData' })
                    }else{
                        message.error(data.exception||'修改出错')
                    }
                }
            } else {
                message.warn(checkFormResult.data.msg || '验重失败')
            }
        },
        //删除
        *delete({payload},{call,put,select}){
            const {ids} = payload;
            yield put({
                type:'updateState',
                payload:{
                    loading:true
                }
            })
            const {data} = yield call(deleteStation,getBaicPostData({
                ids
            }))
            yield put({
                type: 'updateState',
                payload: {
                    loading: false
                }
            })
            if(data&&data.result===0){
                message.success('删除成功')
                yield put({ type: 'getTableData' })
            }else{
                message.error(data.exception||'删除出错');
                
            }
        }
    },
    subscriptions:{
        setup({ dispatch, history }) {
        // dispatch({type:'fetchRemote'})
        history.listen(({ pathname }) => {
            if (pathname === '/stationManage') {

                dispatch({ type: 'getTableData' });
            }
        });
        },
    },
    


}