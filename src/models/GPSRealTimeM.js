import {getGPSConfigIFS,getCarTypeTreeIFS,getCarOrgTreeIFS,getTenantMapInfoIFS,
    driverFuzzySearchIFS,carFuzzySearchIFS,getCarsIFS,getAddressByLngLatIFS,
    getAlarmInfoIFS,getCarOilLineIFS,trackMultiCarRealTimeDataIFS,getFocusAreaListIFS,
    getFocusAreaDetailIFS,getRepairShopListIFS,getGasStationListIFS,getCarStatisticsIFS,
    sendSchedulingMsgIFS,getCarVideoInfoIFS
} from '../services/GPSRealTimeIFS';
import {GPS_ICON} from '../utils/iconMap';
import {VtxTime,VtxUtil,delay} from '../utils/util';
import {carTreeDataProcessor,mapTypeCfg} from '../utils/GPSUtil';
import u from 'updeep';
import {message} from 'antd';

const urlmap = VtxUtil.getUrlParam('mapType');
const MAPTYPE = mapTypeCfg[urlmap=='ac'?'arcgis':'baidu'];

// 工具栏默认配置
let toolboxCfg = [
    {name:'工具', id:'tool', mode:'click', children:[
        {name:'图例',id:'legend'},
        {name:'清空',id:'clearAll'},
        {name:'测距',id:'ranging'},
        {name:'标记',id:'mark'},
    ]},
    {name:'设置', id:'setting', mode:'click', children:[
        {name:'设置刷新频率',id:'setRefresh'},
        // {name:'打开自动缩放',id:'autoZoom'},
        {name:'隐藏车牌号',id:'hideCarCode'},
        {name:'开始批量跟踪',id:'batchTrack'},
    ]},
    {name:'查看关注区',id:'focusArea', mode:'multiple', children:[]},
    {name:'地图图层',id:'mapLayer', mode:'multiple', children:[]},
];

export default {
    namespace: 'realTime',
    state: {
        // 后台GPS开关配置项
        bkCfg:{
            // 调度信息配置
            smsTemplate:'',
            dispatchType:'word',
            // 是否展示油耗
            isOil:false,
            // 地图图层
            otherMapLayer:[],
            // 车辆树初始化是否默认全部勾选
            isCarTreeCheck:true,
            //左侧栏是否变窄显示
            isNarrow: false,
            // 地图点位标签是否显示车辆类型
            isShowCarClasses:false,
            // 是否显示地图比例尺
            isShowScale:false,
            // 是否展示报警信息
            isShowAlarm:true,
            // 是否展示附近的车
            isNearCar:false,
            // 是否展示转速
            showRpm:false,
        },
        // 查询框配置项
        searchCfg:{
            searchOption:[
                {title:'按车牌号',id:'byCar'},
                {title:'按驾驶员',id:'byDriver'}
            ],
            searchWay:'byCar',
            searchVal:'',
            searchList:[]
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
                {name:'状态过滤',id:'carStatus', mode:'multiple', children:[
                    {name:'在线',val:'ONFIRE',selected:true},
                    {name:'停车',val:'STOP',selected:true},
                    {name:'离线',val:'OFFLINE',selected:true},
                    {name:'全部',selected:true},
                ]},
                {name:'作业单位',id:'treeType', mode:'single', children:[
                    {name:'作业单位',val:'org',selected:true},
                    {name:'车辆类型',val:'param',selected:false},
                ]},
            ],
            selectedNodes:[],//勾选的车辆
            treeExpandedKeys:[],//控制树的展开
        },
        // 地图配置项
        mapCfg:{
            mapId:'real_time_map',
            // mapServer:{type:'gis',url:['http://www.hangzhoumap.gov.cn/Tile/ArcGISFlex/HZTDTVECTORBLEND.gis']},
            mapZoomLevel:12,
            setZoomLevel:false,
            mapType:MAPTYPE.frontEnd,
            mapDraw:{}
        },
        // 底部面板
        bottomPanelCfg:{
            alarmData:[],//车辆报警信息
            oilChartLoading:false,
            carOilData:{lineData:[]},//车辆油耗曲线
            nearbyCarIds:[],//附近车辆id
            nearbyDistance:500,
        },
        // 车辆跟踪
        trackCfg:{
            trackPointsId:[],
            trackLines:{},
            trackRecord:[]
        },
        // 工具栏配置
        toolboxCfg:[],
        // 刷新频率配置
        refreshWindow:{
            show:false,
            title:'设置页面自动刷新频率',
            value:'30',
            refreshOptions:[
                {name:'5秒',val:'5'},
                {name:'10秒',val:'10'},
                {name:'20秒',val:'20'},
                {name:'30秒',val:'30'},
                {name:'60秒',val:'60'},
                {name:'2分钟',val:'120'},
                {name:'3分钟',val:'180'},
                {name:'5分钟',val:'300'},
                {name:'10分钟',val:'600'},
                {name:'20分钟',val:'1200'},
                {name:'30分钟',val:'1800'},
            ],
        },
        // 标记点位弹窗
        markWindow:{
            show:false,
            pointInfo:{config:{labelContent:''}}, 
        },
        // 批量跟踪窗口
        batchTrackWindow:{
            show:false,
            checkedKeys:[]
        },
        // 调度信息窗口
        sendMsgWindow:{
            show:false,
            loading:false,
            carId:null,
            msg:'',
            templateMsg:[],
        },
        // 维修厂点位
        repairShop:{
            points:[]
        },
        // 加油站点位
        gasStation:{
            points:[]
        },
        //车辆统计信息 
        carStatistics:{
            carStatusMap:{},
            companyMap:{},
            carTypeMap:{},
            remindMap:{},
            totalCarNum:0
        },
        // 关注区域数据
        focusArea:{},
        // 视频配置
        videoCfg:{
            carId:'',
            videoAddress:['','','',''],
            showVideo:false,
        },
        // 全局
        currentClickPoint:{},//当前点击的点位
        carsInfo:{},//车辆全部信息
        pageStatus:'normal',// 页面状态1.正常normal，2.单车跟踪track-s, 3.多车跟踪track-m
        refreshInterval:30,//定时刷新间隔
        hideCarCode:false,//地图的车辆点位是否隐藏车牌号
        autoZoom:false,//勾选树以后地图是否自动缩放
        showLegend:false,//是否显示图例
        showStatistics:false,//是否显示统计图表
    },

    subscriptions: {
        setup({ dispatch, history }) {
            
        },
    },

    effects: {
        *fetch({ payload }, { call, put, select }) {
            yield put({ type: 'save' });
        },
        // 获取通用配置
        *getGPSConfig({ payload }, { call, put, select }) {
            const {data} = yield call(getGPSConfigIFS);
            const state = yield select(({realTime})=>realTime);

            if(data && data.result===0){
                const cfg = data.data;
                yield put({
                    type:'save',
                    payload:{bkCfg:cfg}
                })
                //---------------------工具栏相关----------------
                // 批量跟踪开关
                if(!cfg.showBatchTrace){
                    const settingIndex = toolboxCfg.map((menu)=>menu.id).indexOf('setting');
                    toolboxCfg = u({
                        [settingIndex]:{
                            children:u.reject((item)=>item.id=='batchTrack')
                        }
                    },toolboxCfg);
                }
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

                // 增加工具栏配置
                yield put({
                    type:'save',
                    payload:{
                        toolboxCfg
                    }
                })
                //---------------------------工具栏相关结束--------------------

                // 初始化调度信息数组
                if(cfg.dispatchType=='sms'){
                    yield put({
                        type:'save',
                        payload:{
                            sendMsgWindow:{
                                templateMsg:(cfg.smsTemplate.match(/%s/g)||[]).map(()=>'')
                            }
                        }
                    })
                }
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
                mapType:MAPTYPE.backEnd
            });
            if(data && data.data && data.data.longitudeDone && data.data.latitudeDone){
                const mapCenter = [data.data.longitudeDone,data.data.latitudeDone];
                yield put({type:'save',payload:{
                    mapCfg: {mapCenter}
                }})
                localStorage.setItem('map_center',JSON.stringify(mapCenter));
            }
        },
        // 获取车辆树
        getCarTree: [function *({ payload }, { call, put, select }) {
            const {initial} = payload||{};
            const state = yield select(({realTime})=>realTime);
            const treeCfg = state.leftPanelCfg.treeConfig;
            let postData = {isRealTime:true};
            let getTreeDataFunc;
            // 输入框查询条件
            switch(state.searchCfg.searchWay){
                case 'byCar': 
                    postData.carCode = state.searchCfg.searchVal;
                    break;
                case 'byDriver': 
                    postData.driver = state.searchCfg.searchVal;
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
                            selectedNodes:state.bkCfg.isCarTreeCheck?treeProcessor.getNodes().map(item=>item.id):[],
                            treeExpand:'openAll',
                            treeExpandedKeys:treeProcessor.getGrandParentNodeIds(),
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
                // 获取报警信息
                if(state.bkCfg.isShowAlarm){
                    yield put({type:'getAlarmInfo',payload:{
                        carIds:treeProcessor.getCarNodeIds().join(',')
                    }})  
                }
                 
                // 更新车辆统计信息
                yield put({
                    type:'getCarStatistics'
                });
            }
        },{type: 'takeLatest'}],
        // 查询框模糊搜索
        getSearchOption:[function*({ payload }, { call, put, select }){
            const search = payload.search;
            const state = yield select(({realTime})=>realTime);
            let res;
            if(search.trim()==''){
                yield put({type:'save',payload:{
                    searchCfg:{searchList:[]}
                }})
                return;
            }
            switch(state.searchCfg.searchWay){
                case 'byCar':
                    res = yield call(carFuzzySearchIFS,{acValue:search});
                    break;
                case 'byDriver':
                    res = yield call(driverFuzzySearchIFS,{acValue:search});
                    break;
            }
            if(res && res.data && res.data.result===0){
                yield put({type:'save',payload:{
                    searchCfg:{searchList:res.data.data}
                }})
            }
        }, {type: 'throttle',ms: 500}],
        // 获取车辆信息
        getCarPoints: [function *({ payload }, { call, put, select }){
            const state = yield select(({realTime})=>realTime);
            const clearOldCarInfo = state.pageStatus=='normal';//如果当前页面处于非跟踪状态，应清除上次车辆信息数据，否则应保留
            let postData = {
                coordType:MAPTYPE.backEnd
            };
            // 输入框查询条件
            switch(state.searchCfg.searchWay){
                case 'byCar': 
                    postData.carCodes = state.searchCfg.searchVal.trim();
                    if(!postData.carCodes)postData.isShowAll='1';
                    break;
                case 'byDriver': 
                    postData.driver = state.searchCfg.searchVal.trim();
                    postData.isShowAll = '1';
                    break;
            }
            // 车辆状态条件
            const carStatusCfg = state.leftPanelCfg.treeConfig.filter(item=>item.id=='carStatus').pop();
            if(carStatusCfg){
                const selectedCarStatus = carStatusCfg.children.filter(item=>item.selected&&item.val).map(item=>item.val);
                if(selectedCarStatus.length>0){
                    postData['carStatus_in'] = selectedCarStatus.join(',');
                }
            }
            const {data} = yield call(getCarsIFS,postData);

            if(data && data.data){
                let carsInfo = {};         
                data.data.map((item)=>{
                    carsInfo[item.carId] = {
                        ...item,
                        currentAddress:''
                    };
                    // 如果点位已更新，重置当前位置字段
                    const oldCarInfo = state.carsInfo[item.carId];
                    if(oldCarInfo && oldCarInfo.latitudeDone==item.latitudeDone && oldCarInfo.longitudeDone==item.longitudeDone){
                        carsInfo[item.carId].currentAddress = oldCarInfo.currentAddress;
                    }
                })
                yield put({
                    type:'save',
                    payload:{
                        carsInfo:clearOldCarInfo?u.constant(carsInfo):carsInfo
                    }
                })
            }
        },{type: 'takeLatest'}],
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
        // 根据经纬度取实际地址，更新到车辆信息数据中
        *setCarAddressByLngLat({ payload }, { call, put, select }){
            const {points} = payload;
            if(points.length==0)return;
            let postData = {
                coordtype:MAPTYPE.mapCoord,
                batch:true,
                location:points.map((item)=>`${item.longitude},${item.latitude}`).join(';')
            }
            const {data} = yield call(getAddressByLngLatIFS,postData);
            if(data && data.data){
                let carAddressInfo = {};
                for(let i=0,len=data.data.length;i<len;i++){
                    carAddressInfo[points[i].id] = {
                        currentAddress:data.data[i].address
                    }
                }
                yield put({
                    type:'save',
                    payload:{
                        carsInfo:carAddressInfo
                    }
                })
            }            
        },
        // 勾选车辆树的车辆,更新地图点位以及面板数据
        *selectCars({ payload }, { call, put, select }){
            const {carIds} = payload;
            const state = yield select(({realTime})=>realTime);
            yield put({
                type:'save',
                payload:{
                    leftPanelCfg:{
                        selectedNodes:carIds
                    }
                }
            });
            // 更新车辆统计信息
            yield put({
                type:'getCarStatistics'
            });
            // 地图中心点和层级根据点位变化
            if(state.autoZoom && state.pageStatus=='normal'){
                yield put({
                    type:'save',
                    payload:{
                        mapCfg:{
                            mapVisiblePoints:{
                                fitView:'point',
                                type:'all'
                            },
                            setVisiblePoints:true
                        }
                        
                    }
                })
                yield call(delay,50);
                yield put({
                    type:'save',
                    payload:{
                        mapCfg:{
                            setVisiblePoints:false
                        }
                    }
                })
            }
        },
        // 点击选中单辆车辆
        *pickOneCar({ payload }, { call, put, select }){
            const {carId,moveMap,calPointsDistance,isOilTab} = payload;
            const state = yield select(({realTime})=>realTime); 
            const thisCarInfo = state.carsInfo[carId];
            console.log(thisCarInfo)
            if(!thisCarInfo){
                console.error('没有此点位');
                return
            }
            // 更新当前点位数据
            yield put({
                type:'save',
                payload:{
                    currentClickPoint:{
                        id:carId,
                        pType:'car'
                    }
                }
            })
            // lbs获取当前地址
            if(!thisCarInfo.currentAddress){
                yield put({
                    type:'setCarAddressByLngLat',
                    payload:{
                        points:[{
                            id:carId,
                            longitude:thisCarInfo.longitudeDone,
                            latitude:thisCarInfo.latitudeDone
                        }]
                    }
                })
            }
            // 地图操作
            if(moveMap && thisCarInfo.latitudeDone && thisCarInfo.longitudeDone){
                yield put({
                    type:'setMapZoomCenter',
                    payload:{
                        center:[thisCarInfo.longitudeDone,thisCarInfo.latitudeDone],
                    }
                })
            }
            // 获取油量曲线
            if(state.bkCfg.isOil && isOilTab){
                yield put({type:'getCarOilData',payload:{carId}});
            }
            
            // 附近车辆过滤
            if(state.bkCfg.isNearCar){
                yield put({
                    type:'getNearByCar',
                    payload:{
                        carId,calPointsDistance
                    }
                })  
            }       
        },
        // 批量更新地址
        batchUpdatePointAddress:[
            function *({ payload }, { call, put, select }) {
                const {carIds} = payload;
                const state = yield select(({realTime})=>realTime); 

                const queryPoints = carIds.filter((id)=>id in state.carsInfo).map((id)=>{
                    if(state.carsInfo[id].currentAddress){
                        return null;
                    }
                    return {
                        id,
                        longitude:state.carsInfo[id].longitudeDone,
                        latitude:state.carsInfo[id].latitudeDone
                    }
                }).filter(item=>item);
                
                yield put({
                    type:'setCarAddressByLngLat',
                    payload:{
                        points:queryPoints
                    }
                })
            },
            {type: 'throttle',ms: 800}
        ],
        // 获取报警信息
        *getAlarmInfo({ payload }, { call, put, select }){
            const today = VtxTime.getFormatTime();
            const {carIds} = payload;
            const {data} = yield call(getAlarmInfoIFS,{
                carIds,
                startTime:`${today} 00:00:00`,
                endTime:`${today} 23:59:59`
            })
            if(data && data.data){
                yield put({type:'save',payload:{
                    bottomPanelCfg:{ alarmData: data.data}
                }})
            }
        },
        // 获取油耗信息
        getCarOilData:[function*({ payload }, { call, put, select }){
            const {carId} = payload;
            const today = VtxTime.getFormatTime();
            const state = yield select(({realTime})=>realTime); 

            if(state.bottomPanelCfg.carOilData.carId==carId){
                return;
            };
            yield put({
                type:'save',
                    payload:{
                        bottomPanelCfg:{
                            oilChartLoading:true,
                            carOilData:{
                                carId,
                                carCode:state.carsInfo[carId].carCode,
                                oilMeasureType:'',
                                sumMileage:0,
                                sumOilUse:0,
                                lineData:[]
                            }
                        }
                    }
            })
            const {data} = yield call(getCarOilLineIFS,{
                carId,
                mapType:MAPTYPE.backEnd,
                startTime:`${today} 00:00:00`,
                endTime:`${today} 23:59:59`
            })

            yield put({
                type:'save',
                payload:{
                    bottomPanelCfg:{
                        oilChartLoading:false
                    }
                }
            })
            if(data && data.data){
                yield put({
                    type:'save',
                    payload:{
                        bottomPanelCfg:{
                            carOilData:{
                                carId,
                                carCode:state.carsInfo[carId].carCode,
                                oilMeasureType:data.data.oilMeasureType,
                                sumMileage:data.data.sumMileage,
                                sumOilUse:data.data.sumOilUse,
                                lineData:data.data.oilLine.map((item)=>{
                                    const [timestamp,value] = item;
                                    return [getFormatTime(timestamp), parseFloat(value.toFixed(2))]
                                })
                            }
                        }
                    }
                })
            }
        },{type:'takeLatest'}],
        // 获取附近车辆数据
        *getNearByCar({ payload }, { call, put, select }){
            const {carId,calPointsDistance} = payload;
            const state = yield select(({realTime})=>realTime); 
            const thisCarInfo = state.carsInfo[carId];

            const cars = state.leftPanelCfg.selectedNodes.filter((id)=>id in state.carsInfo).map((id)=>state.carsInfo[id])
            let nearbyCars = [];
            for(let i=0,len=cars.length;i<len;i++){
                const distance = calPointsDistance([thisCarInfo.longitudeDone,thisCarInfo.latitudeDone],[cars[i].longitudeDone,cars[i].latitudeDone]);
                if(distance<=(parseInt(state.bottomPanelCfg.nearbyDistance)||0)){
                    nearbyCars.push(cars[i].carId);
                }
            }
            yield put({
                type:'save',
                payload:{
                    bottomPanelCfg:{
                        nearbyCarIds:nearbyCars
                    }
                }
            })
        },
        // 跟踪车辆数据
        getTrackData: [function *({ payload }, { call, put, select }){
            const state = yield select(({realTime})=>realTime);
            const trackCarIdsList = state.trackCfg.trackPointsId;
            const trackLines = state.trackCfg.trackLines;
            const trackRecord = state.trackCfg.trackRecord;
            const carsInfo = state.carsInfo;
            const {data} = yield call(trackMultiCarRealTimeDataIFS,{
                needOil:'1',
                carIds:trackCarIdsList.join(','),
                mapType:MAPTYPE.backEnd,
                startTimes: trackCarIdsList.map(carId=>carId in trackLines && carId in carsInfo ?carsInfo[carId].equipmentTime:'').join(',')
            })
           
            if(data && data.data && data.data.length>0){
                const trackInfo = data.data;
                let newTrackLines = {};
                let newTrackRecord = [];
                let newCarPoint = {};
                let newRefreshTime = {};
                // 多辆车跟踪数据处理
                for(let i =0,len=trackInfo.length; i<len; i++){
                    const carId = trackCarIdsList[i];
                    const lineId = `line-${carId}`;
                    const thisCarTrackPoints = trackInfo[i];
                    if(thisCarTrackPoints.length==0)continue;
                    const newPathPoints = thisCarTrackPoints.map((point)=>{
                        return [point.longitudeDone, point.latitudeDone]
                    });
                    const newPaths = carId in trackLines?[...trackLines[carId].paths,...newPathPoints]:[...newPathPoints];
                    // 更新跟踪车辆线
                    if(newPaths.length>1){
                        newTrackLines[carId] = {
                            id:lineId,
                            paths:newPaths
                        }
                    }
                    else if(newPaths.length==1){
                        newTrackLines[carId] = {
                            id:lineId,
                            paths:[newPaths[0],newPaths[0]]
                        }
                    }
                    
                    // 更新跟踪记录,翻转点位顺序
                    thisCarTrackPoints.reverse();
                    newTrackRecord.unshift(...thisCarTrackPoints);         
                    newRefreshTime[carId] = thisCarTrackPoints[0].equipmentTime;
                }
                // 获取跟踪点位的实际地址信息
                let addressPostData = {
                    coordtype:MAPTYPE.mapCoord,
                    batch:true,
                    location:newTrackRecord.map((item)=>`${item.longitudeDone},${item.latitudeDone}`).join(';')
                }
                const addressRes = yield call(getAddressByLngLatIFS,addressPostData);
                if(addressRes.data && addressRes.data.data){
                    const addressArray = addressRes.data.data;
                    for(let i=0,len=addressArray.length;i<len;i++){
                        newTrackRecord[i].currentAddress = addressArray[i].address;
                    }
                }    
                // 更新跟踪车辆信息至最新点位
                for(let i =0,len=newTrackRecord.length;i<len;i++){
                    if(!newCarPoint[newTrackRecord[i].carId]){
                        newCarPoint[newTrackRecord[i].carId] = newTrackRecord[i];
                    }
                }
                // 保存到state
                yield put({
                    type:'save',
                    payload:{
                        trackCfg:{
                            trackLines: newTrackLines,
                            trackRecord: (orig)=>{return [...newTrackRecord,...orig]}
                        },
                        carsInfo:newCarPoint
                    }
                });
                // 是否移动地图,单车跟踪地图移动，多车地图无变化
                if(state.pageStatus=='track-s'){
                    const theFirstTrackCar = newCarPoint[trackCarIdsList[0]]||carsInfo[trackCarIdsList[0]];
                    yield put({
                        type:'setMapZoomCenter',
                        payload:{
                            center:[theFirstTrackCar.longitudeDone,theFirstTrackCar.latitudeDone]
                        }
                    })

                }
            }
        },{type:'takeLatest'}],
        // 获取关注区列表数据
        *getFocusAreaList({ payload }, { call, put, select }){
            const {data} = yield call(getFocusAreaListIFS);
            const state = yield select(({realTime})=>realTime); 
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
                mapType:MAPTYPE.backEnd,
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
                mapType:MAPTYPE.backEnd
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
                        }
                    }
                })
            }
        },
        // 获取维修厂数据
        *getRepairShop({ payload }, { call, put, select }){
            const {data} = yield call(getRepairShopListIFS,{
                mapType:MAPTYPE.backEnd
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
        // 获取车辆统计信息
        getCarStatistics:[function *({ payload }, { call, put, select }){
            const state = yield select(({realTime})=>realTime);
            const selectedCars = state.leftPanelCfg.selectedNodes.filter((id)=>state.leftPanelCfg.carNodeIds.indexOf(id)!=-1);
            const {data} = yield call(getCarStatisticsIFS,{
                carIds:selectedCars.join(',')
            });
            if(data && data.data){
                yield put({
                    type:'save',
                    payload:{
                        carStatistics:u.constant(data.data)
                    }
                })
            }  
        },{type:'takeLatest'}],
        // 发送调度信息
        *sendSchedulingMsg({ payload }, { call, put, select }){
            const state = yield select(({realTime})=>realTime);
            // 判断必填项
            if(state.bkCfg.dispatchType == 'sms'){
                if(state.sendMsgWindow.templateMsg.filter((text)=>text.trim()).length==0){
                    message.warn('填写信息不完整');
                    return;
                }
            }
            else{
                if(!state.sendMsgWindow.msg.trim()){
                    message.warn('填写信息不完整');
                    return;
                }
            }
            // loading
            yield put({
                type:'save',
                payload:{
                    sendMsgWindow:{
                        loading:true
                    }
                }
            })
            const {data} = yield call(sendSchedulingMsgIFS,{
                carIds:state.sendMsgWindow.carId,
                dispatchInfo:state.bkCfg.dispatchType == 'sms'?JSON.stringify(state.sendMsgWindow.templateMsg):state.sendMsgWindow.msg,
                dispatchType: state.bkCfg.dispatchType,
                phone:state.carsInfo[state.sendMsgWindow.carId].driverPhone
            })
            yield put({
                type:'save',
                payload:{
                    sendMsgWindow:{
                        loading:false,
                        show:false
                    }
                }
            })
            message.success('短信调度成功')
        },
        // 更新工具栏的状态
        *updateToolBar({ payload }, { call, put, select }){
            const state = yield select(({realTime})=>realTime);
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
        showVideo:[function *({ payload }, { call, put, select }){
            const {carId} = payload||{};
            if(!carId)return;
            const state = yield select(({realTime})=>realTime);
            const videoNum = state.videoCfg.videoAddress.length;
            
            const {data} = yield call(getCarVideoInfoIFS,{
                billId:state.carsInfo[carId].carCode
            });
            
            if(data && data.data){
                const vd_arr = JSON.parse(data.data);
                if(vd_arr.length>0){
                    let addressArray = vd_arr.map(item=>`/video/cloud/web/videoMonitor/goToBouncedQueryByChannelId.jhtml?channelId=${item.id}`)
                    const padNum = videoNum - addressArray.length;//缺少地址用空字符串填充
                    for(let i=0;i<padNum;i++){
                        addressArray.push('');
                    }
                    yield put({
                        type:'save',
                        payload:{
                            videoCfg:{
                                carId,
                                videoAddress:addressArray,
                                showVideo:true
                            }
                        }
                    })
                    return;
                }
            }
            message.warn('当前车辆没有视频');
        },{type:'takeLatest'}],
        // *trackOneCar({ payload }, { call, put, select }){
        //     const {carId} = payload;
        //     const lineId = `line-${carId}`;
        //     const state = yield select(({realTime})=>realTime);
        //     const carInfo = state.carsInfo[carId];
        //     const oldLineData = state.trackCfg.trackLines[carId];
        //     const lastRefreshTime = oldLineData?state.trackCfg.lastRefreshTime:'';
        //     // 获取跟踪点位
        //     const {data} = yield call(trackOneCarRealTimeDataIFS,{
        //         carId,
        //         mapType:MAPTYPE.backEnd,
        //         startTime:lastRefreshTime
        //     });
            
        //     if(data && data.data){
        //         const newPoints = data.data.map((point)=>{
        //             return [point.longitudeDone, point.latitudeDone]
        //         });
        //         if(newPoints.length==0)return;
        //         const newestPosition = newPoints[newPoints.length-1];
        //         const newPaths = oldLineData?[...oldLineData.paths,...newPoints]:[[carInfo.longitudeDone, carInfo.latitudeDone],...newPoints];
        //         const trackRecord = data.data.reverse();

        //         // 获取跟踪点位的实际地址信息
        //         let addressPostData = {
        //             coordtype:MAPTYPE.mapCoord,
        //             batch:true,
        //             location:trackRecord.map((item)=>`${item.longitudeDone},${item.latitudeDone}`).join(';')
        //         }
        //         const addressRes = yield call(getAddressByLngLatIFS,addressPostData);
        //         if(addressRes.data && addressRes.data.data){
        //             const addressArray = addressRes.data.data;
        //             for(let i=0,len=addressArray.length;i<len;i++){
        //                 trackRecord[i].currentAddress = addressArray[i].address;
        //             }
        //         }    

        //         yield put({
        //             type:'save',
        //             payload:{
        //                 pageStatus:'track',
        //                 trackCfg:{
        //                     trackPointsId:[carId],
        //                     trackLines:{
        //                         [carId]:{
        //                             id:lineId,
        //                             paths:newPaths
        //                         }
        //                     },
        //                     trackRecord:(orig)=>{return [...trackRecord,...orig]},
        //                     lastRefreshTime:VtxTime.getFormatTime({format:'YYYY-MM-DD HH:mm:ss'})
        //                 },
        //                 carsInfo:{
        //                     [carId]:{
        //                         ...trackRecord[0]
        //                         // longitudeDone:newestPosition[0],
        //                         // latitudeDone:newestPosition[1],
        //                         // currentAddress:''
        //                     }
        //                 }
        //             }
        //         })
        //         // 切换中心点到当前跟踪车辆位置
        //         yield put({
        //             type:'setMapZoomCenter',
        //             payload:{
        //                 center:newestPosition,
        //             }
        //         }) 
        //     } 
        // },
    },

    reducers: {
        save(state, action) {
            return u(action.payload,state);
        },
        addTrackCar(state, action){
            const {carIds} = action.payload;
            const newCarIds = carIds.filter((id)=>state.trackCfg.trackPointsId.indexOf(id)==-1);
            return u({
                trackCfg:{
                    trackPointsId:(orig)=>{return [...orig,...newCarIds]},
                }
            },state);
        },
        clearTrack(state, action){
            return u({
                trackCfg:{
                    trackPointsId:[],
                    trackLines:u.constant({}),
                    trackRecord:[],
                }
            },state);
        },
        stopTrack(state, action){
            return u({
                trackCfg:{
                    trackPointsId:[],
                    trackLines:u.constant({}),
                    trackRecord:[],
                },
                pageStatus:'normal'
            },state);
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

// ---------------------------------相关工具函数--------------------------------------

function getFormatTime(timestamp){
    const d = new Date(timestamp);
    const h = d.getHours();
    const m = d.getMinutes();
    return `${h>=10?h:`0${h}`}:${m>=10?m:`0${m}`}`;
}