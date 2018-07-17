import {GPS_ICON} from '../utils/iconMap';
import u from 'updeep';
import {message} from 'antd';
import {VtxTime,VtxUtil,delay} from '../utils/util';
import {carTreeDataProcessor,secondToFormatTime} from '../utils/GPSUtil';
import {getGPSConfigIFS,getCarTypeTreeIFS,getCarOrgTreeIFS,getTenantMapInfoIFS,
    driverFuzzySearchIFS,carFuzzySearchIFS,getAddressByLngLatIFS,
    getAlarmInfoIFS,getCarOilLineIFS,getFocusAreaListIFS,
    getFocusAreaDetailIFS,getRepairShopListIFS,getGasStationListIFS
} from '../services/GPSRealTimeIFS';
import {getHistoryPositionIFS,getCarStopPositionIFS,
    getCarSpeedLineIFS,getTreeDataByAreaIFS,getRefuelingPointIFS,
    getAbnormalPointIFS} from '../services/GPSHistoryIFS';

const urlmap = VtxUtil.getUrlParam('mapType');
// 用于切换地图
const mapTypeCfg = {
    'baidu':{frontEnd:'bmap',backEnd:'bMap',mapCoord:'bd09'},
    'arcgis':{frontEnd:'gmap',backEnd:'',mapCoord:'wgs84'},
}
const MAPTYPE = mapTypeCfg[urlmap=='ac'?'arcgis':'baidu'];


// 历史页面工具栏默认配置
let toolboxCfg = [
    {name:'设置', id:'setting', mode:'click', children:[
        {name:'隐藏历史轨迹',id:'showHistoryPath'},
        {name:'显示停车点位',id:'showStopCar'},
        // {name:'框选车辆',id:'selectArea'},
    ]},
    {name:'查看关注区',id:'focusArea', mode:'multiple', children:[]},
    {name:'地图图层',id:'mapLayer', mode:'multiple', children:[
        // {name:'加油站',id:'gasStation',selected:false},
        // {name:'维修厂',id:'repairShop',selected:false}
    ]},
];


export default {

    namespace: 'history',

    state: {
        // 后台GPS开关配置项
        bkCfg:{
            isNarrow:false
        },
        // 查询框配置项
        carTreeSearchCfg:{
            searchOption:[
                {title:'按车牌号',id:'byCar'},
                {title:'按驾驶员',id:'byDriver'}
            ],
            searchWay:'byCar',
            searchVal:'',
            searchList:[]
        },
        // 地图配置项
        mapCfg:{
            mapId:'history_map',
            // mapServer:{type:'gis',url:['http://www.hangzhoumap.gov.cn/Tile/ArcGISFlex/HZTDTVECTORBLEND.gis']},
            mapZoomLevel:12,
            setZoomLevel:false,
            mapType:MAPTYPE.frontEnd,
            mapPoints:[],
            mapLines:[]
        },
        // 左侧面板配置项
        leftPanelCfg:{
            treeData:[],//树的数据
            carNodeIds:[],//车辆节点id
            //树的配置
            treeConfig:[
                {name:'树节点信息', id:'treeNodeInfo', mode:'multiple', children:[
                    {name:'驾驶员',selected:false},
                    {name:'状态',selected:false},
                    {name:'统计',selected:false},
                    {name:'车型',selected:false},
                    {name:'全部',selected:false},
                ]},
                {name:'作业单位',id:'treeType', mode:'single', children:[
                    {name:'作业单位',val:'org',selected:true},
                    {name:'车辆类型',val:'param',selected:false},
                ]},
            ],
            treeExpandedKeys:[],//控制树的展开
        },
        // 底部面板数据
        bottomPanelCfg:{
            speedLineData:[],
            // 油量分析
            oilLine:{
                lineData:[],
            },
            // 报警数据
            alarmInfo:[],
        },
        // 工具栏配置
        toolboxCfg:toolboxCfg,
        //轨迹查询参数
        trackQueryForm:{
            selectedCarInfo:{},
            selectPeriod:'',
            periodOptions:[{
                id:'today',
                name:'当日'
            },{
                id:'yestoday',
                name:'昨日'
            },{
                id:'dayBeforeYestoday',
                name:'前日'
            },{
                id:'last24hours',
                name:'最近24小时'
            }],
            startTime:'',//moment 时间格式
            endTime:'',//moment 时间格式
        },
        // 车辆轨迹点位
        carPositions:[],
        // 当前选中的车辆轨迹点位
        selectedCarPositionIndex:null,
        // 车辆轨迹线
        carPositionsLine:{},
        // 停车数据
        carStopInfo:[],
        // 加油点位
        refuelingPoints:[],
        selectedRefuelingId:null,
        // 异常点位
        abnormalPoints:[],
        selectedAbnormalId:null,
        // 车辆播放配置
        carPlayCfg:{
            speedRatio:10,//速度倍率
            progress:0,//当前播放进度
            isPlaying:false,//是否处于播放状态
            resetProgressFlag:1,//手动拖动播放进度的标识
            carId:'',
            carCode:'',
            sumStart:'',//总轨迹开始时间
            sumEnd:'',//总轨迹结束时间
            splitTimes:[],//分段轨迹时间段
            selectedSplitTimeIndex:null
        },
        // 车辆框选区域配置
        selectedArea:{
            show:false,
            elemId:'',//框选的图元id
            locations:'',//框选区域左下角和右上角的经纬度
            startTime:'',//当前区域查询的开始时间
            endTime:'',//当前区域查询的结束时间
        },
        // 维修厂点位
        repairShop:{
            points:[]
        },
        // 加油站点位
        gasStation:{
            points:[]
        },
        selectedGasStationId:'',
        // 页面loading状态
        loading:true,
        // 关注区域数据
        focusArea:{},
        // 显示历史轨迹线
        showHistoryPath:true,
        // 显示停车点位
        showStopCar:false,
    },

    subscriptions: {
        setup({ dispatch, history }) {
        },
    },

    effects: {
        // 获取通用配置
        *getGPSConfig({ payload }, { call, put, select }) {
            const {data} = yield call(getGPSConfigIFS);
            const state = yield select(({history})=>history);

            if(data && data.result===0){
                const cfg = data.data;
                // 展示图层处理
                if(!cfg.otherMapLayer||cfg.otherMapLayer.length==0){
                    toolboxCfg = u(u.reject((item)=>item.id=='mapLayer'),toolboxCfg);
                }
                else{
                    let otherMapLayer = [];
                    for(let i=0,len=cfg.otherMapLayer.length;i<len;i++){
                        const item = cfg.otherMapLayer[i];
                        if(!item.isOn){
                            continue;
                        }
                        switch(item.name){
                            case '加油站':
                                otherMapLayer.push({name:item.name,id:'gasStation',selected:false});
                                break;
                            case '维修厂':
                                otherMapLayer.push({name:item.name,id:'repairShop',selected:false});
                                break;
                            default:
                                otherMapLayer.push({name:item.name,id:item.name,selected:false});
                                break;
                        }
                    }
                    toolboxCfg = u({
                        [toolboxCfg.map(item=>item.id).indexOf('mapLayer')]:{
                            children:otherMapLayer
                        }
                    },toolboxCfg);
                }
                // 是否展示关注区
                if(!cfg.isWorkElement ){
                    toolboxCfg = u(u.reject((item)=>item.id=='focusArea'),toolboxCfg);
                }
                // 框选功能
                if(cfg.frameSelect){
                    const settingIndex = toolboxCfg.map(item=>item.id).indexOf('setting');
                    toolboxCfg = u({
                        [settingIndex]:{
                            children:(orig)=>{return [...orig,{name:'框选车辆',id:'selectArea'}]}
                        }
                    },toolboxCfg);
                }

                // 增加工具栏配置
                yield put({
                    type:'save',
                    payload:{
                        toolboxCfg
                    }
                })
                yield put({
                    type:'save',
                    payload:{bkCfg:cfg}
                })
                //---------------------工具栏相关----------------
                
                //---------------------------工具栏相关结束--------------------

            }
        },
        // 设置中心点
        *getCenterLocation({ payload }, { call, put, select }){
            const localMapCenter = localStorage.getItem('map_center');
            if(localMapCenter){
                yield put({type:'save',payload:{
                    mapCfg: {mapCenter:JSON.parse(localMapCenter)}
                }})
            }
            const {data} = yield call(getTenantMapInfoIFS,{
                coordType:MAPTYPE.mapCoord
            });
            if(data && data.data && data.data.longitudeDone && data.data.latitudeDone){
                const mapCenter = [data.data.longitudeDone,data.data.latitudeDone];
                yield put({type:'save',payload:{
                    mapCfg: {mapCenter}
                }})
                localStorage.setItem('map_center',JSON.stringify(mapCenter));
            }
        },
        // 设置地图等级和中心点
        *setMapZoomCenter({ payload }, { call, put, select }){
            const {zoom,center} = payload ||{};
            let cfg = {};
            if(zoom){
                cfg.setZoomLevel = true;
                cfg.mapZoomLevel = zoom;
            }
            if(center){
                cfg.mapCenter = center;
                cfg.setCenter = true;
            }
            
            yield put({
                type:'save',
                payload:{
                    mapCfg:cfg
                }
            });
            yield call(delay,50);
            yield put({
                type:'save',
                payload:{
                    mapCfg:{
                        setCenter:false,
                        setZoomLevel:false
                    }
                }
            });
        },
        // 查询框模糊搜索
        getSearchOption:[function*({ payload }, { call, put, select }){
            const search = payload.search;
            const state = yield select(({history})=>history);
            let res;
            if(search.trim()==''){
                yield put({type:'save',payload:{
                    carTreeSearchCfg:{searchList:[]}
                }})
                return;
            }
            switch(state.carTreeSearchCfg.searchWay){
                case 'byCar':
                    res = yield call(carFuzzySearchIFS,{acValue:search});
                    break;
                case 'byDriver':
                    res = yield call(driverFuzzySearchIFS,{acValue:search});
                    break;
            }
            if(res && res.data && res.data.result===0){
                yield put({type:'save',payload:{
                    carTreeSearchCfg:{searchList:res.data.data}
                }})
            }
        }, {type: 'throttle',ms: 500}],
        // 获取车辆树 
        getCarTree: [function *({ payload }, { call, put, select }) {
            const {initial} = payload||{};
            const state = yield select(({history})=>history);
            const treeCfg = state.leftPanelCfg.treeConfig;
            let postData = {isRealTime:false};
            let getTreeDataFunc;
            // 输入框查询条件
            switch(state.carTreeSearchCfg.searchWay){
                case 'byCar': 
                    postData.carCode = state.carTreeSearchCfg.searchVal;
                    break;
                case 'byDriver': 
                    postData.driver = state.carTreeSearchCfg.searchVal;
                    break;
            }
            // 车辆状态条件
            const carStatusCfg = treeCfg.filter(item=>item.id=='carStatus').pop();
            if(carStatusCfg){
                const selectedCarStatus = carStatusCfg.children.filter(item=>item.selected&&item.val).map(item=>item.val);
                if(selectedCarStatus.length>0){
                    postData['carStatus_in'] = selectedCarStatus.join(',');
                }
            }
            // 根据树的类型选择接口
            const treeTypeCfg = treeCfg.filter(item=>item.id=='treeType').pop();
            if(treeTypeCfg){
                const treeType = treeTypeCfg.children.filter(item=>item.selected).pop().val;
                switch(treeType){
                    case 'org':
                        getTreeDataFunc = getCarOrgTreeIFS;
                        break;
                    case 'param':
                        getTreeDataFunc = getCarTypeTreeIFS;
                        break;
                }
            }

            const {data} = yield call(getTreeDataFunc, postData);
            
            if(data && data.data && Array.isArray(data.data.items)){
                // 初始化树时判断全选或全不选,是否展开
                const treeProcessor = new carTreeDataProcessor(data.data.items);
                if(initial){
                    yield put({type:'save',payload:{
                        leftPanelCfg:{
                            treeData:treeProcessor.getNewTree(),
                            treeExpand:'openAll',
                            treeExpandedKeys:treeProcessor.getParentNodeIds(),
                            carNodeIds:treeProcessor.getCarNodeIds()
                        }
                    }});
                }
                else{
                    yield put({type:'save',payload:{
                        leftPanelCfg:{
                            treeData:treeProcessor.getNewTree(),
                            carNodeIds:treeProcessor.getCarNodeIds()
                        }
                    }});
                }
            }
        },{type: 'takeLatest'}],
        getCarTreeBySelectedArea:[function *({ payload }, { call, put, select }){
            const state = yield select(({history})=>history);
            const {startTime,endTime,locations} = state.selectedArea;
            const {data} = yield call(getTreeDataByAreaIFS,{
                nearType:'box',
                coordType:MAPTYPE.mapCoord,
                startTime,endTime,
                locations
            })

            if(data && data.data && Array.isArray(data.data.items)){
                // 初始化树时判断全选或全不选,是否展开
                const treeProcessor = new carTreeDataProcessor(data.data.items);
             
                yield put({type:'save',payload:{
                    leftPanelCfg:{
                        treeData:treeProcessor.getNewTree(),
                        carNodeIds:treeProcessor.getCarNodeIds()
                    }
                }});
            }
            
        },{type: 'takeLatest'}],
        // 根据车辆时间段搜索
        searchByCarTimeSlot:[function *({ payload }, { call, put, select }){
            const state = yield select(({history})=>history);
            const {timeSlotIndex} = payload||{};

            // 查询车辆id,车牌号，开始时间(moment格式)，结束时间(moment格式)，开始时间(字符串)，结束时间(字符串)
            let carId,carCode,startTime,endTime,startTimeStr,endTimeStr;

            // 查询现有的某个子时间段
            if(timeSlotIndex!==undefined){
                const {splitTimes} = state.carPlayCfg;
                
                carId = state.carPlayCfg.carId;
                if(timeSlotIndex===null){
                    startTimeStr = state.trackQueryForm.startTime.format('YYYY-MM-DD HH:mm:SS');
                    endTimeStr = state.trackQueryForm.endTime.format('YYYY-MM-DD HH:mm:SS');
                }
                else{
                    startTimeStr = splitTimes[timeSlotIndex].startTime;
                    endTimeStr = splitTimes[timeSlotIndex].endTime;
                }
                yield put({
                    type:'save',
                    payload:{carPlayCfg:{selectedSplitTimeIndex:timeSlotIndex}}
                })
                // 查询某分段轨迹
                yield put({
                    type:'getSubPath',
                    payload:{
                        carId,startTimeStr,endTimeStr
                    }
                })
            }
            // 重新查询新的时间段
            else{
                [carId,carCode,startTime,endTime] = [
                    state.trackQueryForm.selectedCarInfo.carId,
                    state.trackQueryForm.selectedCarInfo.carCode,
                    state.trackQueryForm.startTime,
                    state.trackQueryForm.endTime
                ];
                if(!(carId && startTime && endTime)){
                    if(!carId)message.warn('未选中车辆');
                    if(!startTime)message.warn('未选开始时间');
                    if(!endTime)message.warn('未选结束时间');
                    return;
                }
                startTimeStr = startTime.format('YYYY-MM-DD HH:mm:SS');
                endTimeStr = endTime.format('YYYY-MM-DD HH:mm:SS');

                // 查询轨迹
                yield put({
                    type:'getCarPath',
                    payload:{
                        carId,carCode,startTime,endTime,startTimeStr,endTimeStr
                    }
                })
            }
            // 获取车辆速度分析曲线数据
            yield put({
                type:'getCarSpeedLine',
                payload:{
                    carId,startTimeStr,endTimeStr
                }
            });
            // 获取停车分析数据
            yield put({
                type:'getCarStopInfo',
                payload:{
                    carId,startTimeStr,endTimeStr
                }
            });
            if(state.bkCfg.isShowAlarm){
                // 获取报警分析数据
                yield put({
                    type:'getAlarmInfo',
                    payload:{
                        carId,startTimeStr,endTimeStr
                    }
                });
            }
            
            if(state.bkCfg.isOil){
                // 获油量曲线数据
                yield put({
                    type:'getOilLineData',
                    payload:{
                        carId,startTimeStr,endTimeStr
                    }
                });
            }
            
            // 获取加油点位
            yield put({
                type:'getRefuelingPoint',
                payload:{
                    carId,startTimeStr,endTimeStr
                }
            });
            // 获取异常点位
            yield put({
                type:'getAbnormalPoint',
                payload:{
                    carId,startTimeStr,endTimeStr
                }
            });
            

        },{type: 'takeLatest'}],
        // 获取车辆总轨迹
        getCarPath:[function *({ payload }, { call, put, select }) {
            const {carId,carCode,startTime,endTime,startTimeStr,endTimeStr} = payload;
            
            const {data} = yield call(getHistoryPositionIFS,{
                carId,
                startTime:startTimeStr,
                endTime:endTimeStr,
                coordType:MAPTYPE.mapCoord,
                needTracks:1
            })
            if(data && data.data && Array.isArray(data.data.positions)){
                if(data.data.positions.length==0){
                    message.info('车辆在此时间段内没有轨迹点位');
                }
                yield put({
                    type:'save',
                    payload:{
                        carPositions:data.data.positions.map((item,index)=>{return {...item,index:index+1}}),
                        selectedCarPositionIndex:null,
                        carPlayCfg:{
                            carId,
                            carCode,
                            sumStart:startTimeStr,
                            sumEnd:endTimeStr,
                            progress:0,
                            resetProgressFlag:(val)=>{return val+1},
                            splitTimes:data.data.tracks.map(item=>({
                                startTime:`${item.startDate} ${item.startTime}`,
                                endTime:`${item.endDate} ${item.endTime}`
                            })),
                            selectedSplitTimeIndex:null
                        },
                        carPositionsLine:data.data.positions.length>1?u.constant({
                            id:`line-${carId}`,
                            paths:data.data.positions.map(item=>[item.longitudeDone,item.latitudeDone]),
                            config:{
                                lineWidth:3,
                                color:'#1DA362'
                            }
                        }):u.constant({}),
                        // mapCfg:{
                        //     mapLines:data.data.positions.length>1?[{
                        //         id:`line-${carId}`,
                        //         paths:data.data.positions.map(item=>[item.longitudeDone,item.latitudeDone]),
                        //         config:{
                        //             lineWidth:3,
                        //             color:'#1DA362'
                        //         }
                        //     }]:[]
                        // }
                    }
                })
            }
        },{type: 'takeLatest'}],
        // 获取车辆某个分段轨迹
        getSubPath:[function *({ payload }, { call, put, select }) {
            const {carId,startTimeStr,endTimeStr} = payload;
           
            const {data} = yield call(getHistoryPositionIFS,{
                carId,
                startTime:startTimeStr,
                endTime:endTimeStr,
                coordType:MAPTYPE.mapCoord,
            })
            if(data && data.data && Array.isArray(data.data.positions)){
                if(data.data.positions.length==0){
                    message.info('车辆在此时间段内没有轨迹点位');
                }
                yield put({
                    type:'save',
                    payload:{
                        carPositions:data.data.positions.map((item,index)=>{
                            return {...item,index:index+1}
                        }),
                        selectedCarPositionIndex:null,
                        carPlayCfg:{
                            progress:0,
                            resetProgressFlag:(val)=>{return val+1},
                        },
                        carPositionsLine:data.data.positions.length>1?u.constant({
                            id:`line-${carId}`,
                            paths:data.data.positions.map(item=>[item.longitudeDone,item.latitudeDone]),
                            config:{
                                lineWidth:3,
                                color:'#1DA362'
                            }
                        }):u.constant({}),
                        // mapCfg:{
                        //     mapLines:data.data.positions.length>1?[{
                        //         id:`line-${carId}`,
                        //         paths:data.data.positions.map(item=>[item.longitudeDone,item.latitudeDone]),
                        //         config:{
                        //             lineWidth:3,
                        //             color:'#1DA362'
                        //         }
                        //     }]:[]
                        // }
                    }
                })
            }
        },{type: 'takeLatest'}],
        // 获取车辆速度分析曲线数据
        getCarSpeedLine:[function *({ payload }, { call, put, select }){
            const {carId,startTimeStr,endTimeStr} = payload;
            const {data} = yield call(getCarSpeedLineIFS,{
                carId,
                startTime:startTimeStr,
                endTime:endTimeStr
            });
            if(data && Array.isArray(data.data)){
                yield put({
                    type:'save',
                    payload:{
                        bottomPanelCfg:{
                            speedLineData:data.data
                        }
                    }
                });
            }
        },{type: 'takeLatest'}],
        // 获取停车分析数据
        getCarStopInfo:[function *({ payload }, { call, put, select }){
            const {carId,startTimeStr,endTimeStr} = payload;
            const {data} = yield call(getCarStopPositionIFS,{
                carId,
                startTime:startTimeStr,
                endTime:endTimeStr,
                time:600,
                coordType:MAPTYPE.mapCoord,
            });
            if(data && data.data){
                yield put({
                    type:'save',
                    payload:{
                        carStopInfo:data.data.map((item,index)=>{
                            return {
                                ...item,
                                index:index+1,
                                stopTimeStr:secondToFormatTime(item.stopTime),
                            }
                        })
                    }
                })
            }
        },{type: 'takeLatest'}],
        // 获取报警分析数据
        getAlarmInfo:[function *({ payload }, { call, put, select }){
            const {carId,startTimeStr,endTimeStr} = payload;
            const {data} = yield call(getAlarmInfoIFS,{
                carIds:carId,
                startTime:startTimeStr,
                endTime:endTimeStr
            });
            if(data && Array.isArray(data.data)){
                yield put({
                    type:'save',
                    payload:{
                        bottomPanelCfg:{
                            alarmInfo:data.data.map((item,index)=>{
                                return {...item,index:index+1}
                            })
                        }
                    }
                })
            }
        },{type: 'takeLatest'}],
         // 历史轨迹批量更新地址
         getAddressForCarPositions:[
            function *({ payload }, { call, put, select }) {
                const {startIndex,endIndex} = payload;
                const state = yield select(({history})=>history); 

                // 需要获取实时地址的点位下标
                let indexArr = [];
                for(let i=startIndex;i<endIndex;i++){
                    if(!state.carPositions[i].address){
                        indexArr.push(i);
                    }
                }
                if(indexArr.length==0)return;

                // 获取跟踪点位的实际地址信息
                let addressPostData = {
                    coordtype:MAPTYPE.mapCoord,
                    batch:true,
                    location:indexArr.map((i)=>`${state.carPositions[i].longitudeDone},${state.carPositions[i].latitudeDone}`).join(';')
                }
                
                const addressRes = yield call(getAddressByLngLatIFS,addressPostData);
                // 需要更新的数据
                const carPositionsUpdates = {};
                if(addressRes.data && addressRes.data.data){
                    const addressArray = addressRes.data.data;
                    for(let i=0,len=indexArr.length;i<len;i++){
                        carPositionsUpdates[indexArr[i]] = {address:addressArray[i].address};
                    }
                }    
                
                yield put({
                    type:'save',
                    payload:{
                        carPositions:carPositionsUpdates
                    }
                })
            },
            {type: 'throttle',ms: 800}
        ],
        // 获取油量分析折线
        getOilLineData:[function *({ payload }, { call, put, select }){
            const {carId,startTimeStr,endTimeStr} = payload;
            const {data} = yield call(getCarOilLineIFS,{
                carId,
                startTime:startTimeStr,
                endTime:endTimeStr,
                coordType:MAPTYPE.mapCoord,
            });
            if(data && data.data){
                yield put({
                    type:'save',
                    payload:{
                        bottomPanelCfg:{
                            oilLine:{
                                oilMeasureType:data.data.oilMeasureType,
                                sumMileage:data.data.sumMileage,
                                sumOilUse:data.data.sumOilUse,
                                lineData:data.data.oilLine.map((item)=>{
                                    const [timestamp,value] = item;
                                    return [VtxTime.getFormatTime({time:new Date(timestamp),format:'YYYY-MM-DD HH:mm:ss'}), parseFloat(value.toFixed(2))]
                                })
                            }
                        }
                    }
                })
            }
        },{type: 'takeLatest'}],
        // 获取加油点位
        getRefuelingPoint:[function *({ payload }, { call, put, select }){
            const {carId,startTimeStr,endTimeStr} = payload;
            const {data} = yield call(getRefuelingPointIFS,{
                carId,
                startTime:startTimeStr,
                endTime:endTimeStr,
                coordType:MAPTYPE.mapCoord,
            });
            if(data && Array.isArray(data.data)){
                yield put({
                    type:'save',
                    payload:{
                        refuelingPoints:data.data,
                        selectedRefuelingId:null,
                    }
                })
            }
            
        },{type: 'takeLatest'}],

        // 获取异常点位
        getAbnormalPoint:[function *({ payload }, { call, put, select }){
            const {carId,startTimeStr,endTimeStr} = payload;
            const {data} = yield call(getAbnormalPointIFS,{
                carId,
                startTime:startTimeStr,
                endTime:endTimeStr,
                coordType:MAPTYPE.mapCoord,
            });
            if(data && Array.isArray(data.data)){
                yield put({
                    type:'save',
                    payload:{
                        abnormalPoints:data.data,
                        selectedAbnormalId:null
                    }
                })
            }
        },{type: 'takeLatest'}],
        // 获取关注区列表数据
        *getFocusAreaList({ payload }, { call, put, select }){
            const {data} = yield call(getFocusAreaListIFS);
            const state = yield select(({history})=>history); 
            const focusAreaIndex = state.toolboxCfg.map((menu)=>menu.id).indexOf('focusArea');
            if(focusAreaIndex==-1)return;

            if(data && data.data){
                const focusAreaList = data.data.map((item)=>{
                    return  {name:item.name,id:item.id,selected:false}
                })
                
                yield put({
                    type:'save',
                    payload:{
                        toolboxCfg:{
                            [focusAreaIndex]:{children:focusAreaList}
                        }
                    }
                })
            }
        },
        // 获取关注区详情数据
        *getFocusAreaDetail({ payload }, { call, put, select }){
            const {areaId} = payload;
            const {data} = yield call(getFocusAreaDetailIFS,{
                coordType:MAPTYPE.mapCoord,
                typeId:areaId
            });
           
            if(data && data.data){
                yield put({
                    type:'save',
                    payload:{
                        focusArea:{
                            [areaId]:data.data
                        }
                    }
                })
            }
        },
        // 获取加油站数据
        *getGasStation({ payload }, { call, put, select }){
            const {data} = yield call(getGasStationListIFS,{
                coordType:MAPTYPE.mapCoord
            })
            if(data && data.data){
                const mapStationPoints = data.data.map((item)=>{
                    return {
                        id:item.id,
                        attr:{
                            code:item.code,
                            name:item.name,
                            address:item.address
                        },
                        latitude:item.latitudeDone,
                        longitude:item.longitudeDone,
                        canShowLabel:true,
                        url: GPS_ICON.map.gasStation,
                        pointType:'gasStation',
                        config:{
                            width:30,
                            height:30,
                            markerContentX:-15,
                            markerContentY:-15,
                            labelContent:item.name
                        }
                    }
                })
                yield put({
                    type:'save',
                    payload:{
                        gasStation:{
                            points:mapStationPoints
                        },
                        selectedGasStationId:null
                    }
                })
            }
        },
        // 获取维修厂数据
        *getRepairShop({ payload }, { call, put, select }){
            const {data} = yield call(getRepairShopListIFS,{
                coordType:MAPTYPE.mapCoord
            })
            if(data && data.data){
                const mapRepairShopPoints = data.data.map((item)=>{
                    return {
                        id:item.id,
                        latitude:item.latitudeDone,
                        longitude:item.longitudeDone,
                        canShowLabel:true,
                        url: GPS_ICON.map.repairShop,
                        config:{
                            width:30,
                            height:30,
                            markerContentX:-15,
                            markerContentY:-15,
                            labelContent:item.name
                        }
                    }
                })
                yield put({
                    type:'save',
                    payload:{
                        repairShop:{
                            points:mapRepairShopPoints
                        }
                    }
                })
            }
        },
      
        // 更新工具栏的状态
        *updateToolBar({ payload }, { call, put, select }){
            const state = yield select(({history})=>history);
            let {menuId,subMenuId,menuIndex,subMenuIndex,opWay} = payload||{};
            if(menuId){
                menuIndex = state.toolboxCfg.map(item=>item.id).indexOf(menuId);
            }
            if(subMenuId){
                subMenuIndex = state.toolboxCfg[menuIndex].children.map(item=>item.id).indexOf(subMenuId)
            }
            switch(opWay){
                case 'clear'://清空所有选中
                    if(menuIndex>-1){
                        yield put({
                            type:'save',
                            payload:{
                                toolboxCfg:{
                                    [menuIndex]:{
                                        children:u.map({selected:false},state.toolboxCfg[menuIndex].children)
                                    }
                                }
                            }
                        })
                    }
                    break;
                case 'toggle':;//切换选中状态
                    if(menuIndex>-1 && subMenuIndex>-1){
                        yield put({
                            type:'save',
                            payload:{
                                toolboxCfg:{
                                    [menuIndex]:{
                                        children:{
                                            [subMenuIndex]:{
                                                selected: !state.toolboxCfg[menuIndex].children[subMenuIndex].selected
                                            }
                                        }
                                    }
                                }
                            }
                        })
                    }
            }
        },
    },

    reducers: {
        save(state, action) {
            return u(action.payload,state);
        },
        updateTreeCfg(state, action){
            const {menuIndex,menuOptionIndex} = action.payload;
            const menuInfo = state.leftPanelCfg.treeConfig[menuIndex];
            const currentMenuOption = menuInfo.children[menuOptionIndex];
            // 单选
            if(menuInfo.mode=='single'){
                if(currentMenuOption.selected){
                    return state;
                }
                return u({
                    leftPanelCfg:{
                        treeConfig:{
                            [menuIndex]:{
                                name:currentMenuOption.name,
                                children: u({[menuOptionIndex]:{selected:true}}, u.map({selected:false},menuInfo.children))
                            }
                        }
                    }
                },state);
            }
            // 多选全部勾选
            else if(currentMenuOption.name=='全部'){
                return u({
                    leftPanelCfg:{
                        treeConfig:{
                            [menuIndex]:{
                                children:u.map({selected:!currentMenuOption.selected},menuInfo.children)
                            }
                        }
                    }
                },state);
            }
            // 多选其他勾选
            else{
                let allIndex = -1, allSelected = true;
                for(let i=0,len=menuInfo.children.length;i<len;i++){
                    if(menuInfo.children[i].name=='全部'){
                        allIndex = i;
                    }
                    else{
                        if(i==menuOptionIndex)
                            allSelected = allSelected && !menuInfo.children[i].selected;
                        else
                            allSelected = allSelected && menuInfo.children[i].selected;
                    }
                }
                return u({
                    leftPanelCfg:{
                        treeConfig:{
                            [menuIndex]:{children:{
                                [menuOptionIndex]:{selected:!currentMenuOption.selected},
                                [allIndex]:{selected:allSelected}
                            }}
                        }
                    }
                },state);
            }
        }
    },

};


