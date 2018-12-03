import React from 'react';
import {connect} from 'dva';
import {VtxModal,VtxModalList,VtxDate} from 'vtx-ui';
import { Button, Switch,Input  } from 'antd';
import moment from 'moment';
import SearchInput from '../GPSRealTime/searchInput';
import ToolBox from '../GPSRealTime/toolBox';
import LeftPanel from './leftPanel';
import BottomPanel from './bottomPanel';
import TrackMap from './trackMap';
import CarPlayControl from './carPlayControl';
import Loading from '../../components/loading';
import style from './index.less';

import {VtxTime,strToColor,merge,VtxUtil} from '../../utils/util';
import {GPS_ICON} from '../../utils/iconMap';

const {VtxDatePicker} = VtxDate;

class GPSHistory extends React.Component{
    constructor(props){
        super();
        this.leftPanelInstance = null;
        this.bottomPanelInstance = null;
        this.map = null;
    }
    componentDidMount(){
        const {dispatch} = this.props;
    
        // 获取通用配置
        Promise.all([
            dispatch({type:'history/getGPSConfig'}),
            dispatch({type:'common/getTenantInfo'}),
        ]).then(()=>{
            // 实时页面跳转过来查询车辆轨迹
            if(VtxUtil.getUrlParam('carId')){ 
                const carId = VtxUtil.getUrlParam('carId'),
                carCode = VtxUtil.getUrlParam('carCode'),
                startTime = VtxUtil.getUrlParam('startTime'),
                endTime = VtxUtil.getUrlParam('endTime');

                let updatedObj = {
                    trackQueryForm:{
                        selectedCarInfo:{carId:decodeURIComponent(carId)}
                    }
                }
                if(carCode){
                    updatedObj.trackQueryForm.selectedCarInfo.carCode = decodeURIComponent(carCode);
                }
                if(startTime){
                    const startTime_moment = moment(decodeURIComponent(startTime));
                    if(startTime_moment.isValid()){
                        updatedObj.trackQueryForm.startTime = startTime_moment;
                    }
                }
                if(endTime){
                    const endTime_moment = moment(decodeURIComponent(endTime));
                    if(endTime_moment.isValid()){
                        updatedObj.trackQueryForm.endTime = endTime_moment;
                    }
                }
                this.updateModel(updatedObj);
                dispatch({
                    type:'history/searchByCarTimeSlot'
                })
            }

            // 设置地图中心点
            dispatch({
                type:'history/setMapCfg'
            });
            // 获取关注区列表
            dispatch({type:'history/getFocusAreaList'});
        })
      
        // 获取车辆树
        dispatch({
            type:'history/getCarTree',
            payload:{initial:true}
        });
        
    }
    // 车辆历史数据,树查询
    search(){
        const {dispatch} = this.props;
        dispatch({type:'history/getCarTree'});
        this.clearSelectArea();
    }
    // 选择关注区
    selectFocusArea(areaIndex,menuIndex){
        const selectedArea = this.props.toolboxCfg[menuIndex].children[areaIndex];
        if(!selectedArea.selected){
            this.props.dispatch({
                type:'history/getFocusAreaDetail',
                payload:{
                    areaId:selectedArea.id
                }
            })
        }
        this.props.dispatch({
            type:'history/updateToolBar',
            payload:{
                opWay:'toggle',
                menuIndex,
                subMenuIndex:areaIndex
            }
        })
    }
    // 获取工具栏某个菜单的选中状态
    getToolBarStateById(id,property){
        for(let i=0,len=this.props.toolboxCfg.length;i<len;i++){
            const menuItem = this.props.toolboxCfg[i];
            if(menuItem.id==id){
                return menuItem[property];
            }
            for(let j=0,len2 = menuItem.children.length;j<len2;j++){
                if(menuItem.children[j].id==id){
                    return menuItem.children[j][property];
                }
                break;
            }
        }
        return undefined;
    }
    // 工具栏点击后的操作
    toolBoxSelect(menuIndex,optIndex){
        const t = this;
        const menuId = t.props.toolboxCfg[menuIndex].id,
        optionId = t.props.toolboxCfg[menuIndex].children[optIndex].id;
        switch(optionId){
            case 'showHistoryPath':
                t.updateModel({
                    toolboxCfg:{
                        [menuIndex]:{
                            children:{[optIndex]:{
                                name:!t.props.showHistoryPath?'隐藏历史轨迹':'显示历史轨迹'
                            }}
                        }
                    },
                    showHistoryPath:!t.props.showHistoryPath
                });
                break;
            case 'showStopCar':
                t.updateModel({
                    toolboxCfg:{
                        [menuIndex]:{
                            children:{[optIndex]:{
                                name:!t.props.showStopCar?'隐藏停车点位':'显示停车点位'
                            }}
                        }
                    },
                    showStopCar:!t.props.showStopCar
                });
                break;
            case 'selectArea':
                t.updateModel({
                    mapCfg:{
                        isDraw:true,
                        mapDraw:{
                            geometryType:'rectangle',
                            data:{id:'selectArea'}
                        }
                    }
                });
                break;
            case 'gasStation'://是否显示加油站
                const gasStationSelected = this.getToolBarStateById('gasStation','selected');
                this.props.dispatch({
                    type:'history/updateToolBar',
                    payload:{
                        menuId:'mapLayer',
                        subMenuId:'gasStation',
                        opWay:'toggle'
                    }
                });
                if(!gasStationSelected){
                    this.props.dispatch({
                        type:'history/getGasStation'
                    });
                }
                break;
            case 'repairShop'://是否显示维修厂
                const repairShopSelected = this.getToolBarStateById('repairShop','selected');
                this.props.dispatch({
                    type:'history/updateToolBar',
                    payload:{
                        menuId:'mapLayer',
                        subMenuId:'repairShop',
                        opWay:'toggle'
                    }
                });
                if(!repairShopSelected){
                    this.props.dispatch({
                        type:'history/getRepairShop'
                    });
                }
                break;
            case 'alarmSpeed':
                t.updateModel({
                    pathAlarmSetting:{
                        show:true
                    }
                });
                break;
        }
        // 关注区点击处理
        if(menuId=='focusArea'){
            this.selectFocusArea(optIndex,menuIndex);
        }
    }
    // 关注区地图数据处理
    focusAreaDataProcessor(){
        const {toolboxCfg,focusArea} = this.props;
        const focusAreaMenu = toolboxCfg.filter((item)=>item.id=='focusArea').pop();
        let areaData = {
            mapPoints:[],
            mapLines:[],
            mapPolygons:[],
            mapCircles:[],
        };
        if(focusAreaMenu && focusAreaMenu.children.length>0){
            const selectedAreaIds = focusAreaMenu.children.filter((item)=>item.selected).map((item)=>item.id);
            for(let i=0,len=selectedAreaIds.length;i<len;i++){
                if(focusArea[selectedAreaIds[i]]){
                    focusArea[selectedAreaIds[i]].map((item)=>{
                        switch(item.shape){
                            case 'point':
                                areaData.mapPoints.push({
                                    id:item.id,
                                    longitude:item.paramsDone.split(',')[0],
                                    latitude:item.paramsDone.split(',')[1],
                                });
                                break;
                            case 'line':
                                areaData.mapLines.push({
                                    id:item.id,
                                    paths:item.paramsDone.split(';').map((p)=>p.split(',')),
                                });
                                break;
                            case 'rectangle':
                            case 'polygon':
                                areaData.mapPolygons.push({
                                    id:item.id,
                                    rings:item.paramsDone.split(';').map((p)=>p.split(',')),
                                    config:{
                                        lineWidth:2,
                                        color:strToColor(item.id),
                                        lineColor:strToColor(item.id),
                                        pellucidity:0.3
                                    }
                                });
                                break;
                            case 'circle':
                                areaData.mapCircles.push({
                                    id:item.id,
                                    longitude:item.paramsDone.split(',')[0],
                                    latitude:item.paramsDone.split(',')[1],
                                    radius:item.radius,
                                    config:{
                                        lineWidth:2,
                                        color:strToColor(item.id),
                                        lineColor:strToColor(item.id),
                                        pellucidity:0.3
                                    }
                                });
                                break;
                        }
                    })
                }
            }
            return areaData;
        }
        else{
            return {};
        }
    }
    // 清除框选车辆面
    clearSelectArea(){
        this.updateModel({
            selectMode:false,
            mapCfg:{
                mapRemove:[{id: 'selectArea',type:'draw'}],
                isRemove:true,
            }
        });
        setTimeout(()=>{
            this.updateModel({
                mapCfg:{
                    mapRemove:[],
                    isRemove:false,
                }
            });
        },50)
    }
    // 点击地图点位
    clickMapPoint(obj){
        const t = this;
        // 打开详情面板并切换到当前tab页
        switch(obj.pointType){
            case 'gasStation':
                t.leftPanelInstance.switchDetailPn('gasStation');
                t.leftPanelInstance.detailPnToggle('open');
                t.updateModel({
                    selectedGasStationId:obj.id
                })
                break;
            case 'carRefueling':
                t.leftPanelInstance.switchDetailPn('carRefueling');
                t.leftPanelInstance.detailPnToggle('open');
                t.updateModel({
                    selectedRefuelingId:obj.id
                })
                break;
            case 'carAbnormal':
                t.leftPanelInstance.switchDetailPn('carAbnormal');
                t.leftPanelInstance.detailPnToggle('open');
                t.updateModel({
                    selectedAbnormalId:obj.id
                })
                break;
        }
    }
    // 生成历史轨迹路段
    genHistoryLines(){
        const {carPositions,pathAlarmSetting} = this.props;
        function guiJiFenDuan(trace, speedLimit){
            let splitedTraces = [];//分割轨迹段，单位：轨迹数组
            let currentTrace = [];//当前轨迹段，单位：点位
            const lineColorMap = {
                normal:'#1DA362',
                over:'red'
            }
            // 1.分段
            for(let i=0,len=trace.length;i<len;i++){
                if(trace[i].speed>=speedLimit){
                    switch(currentTrace.lineType){
                        case 'over':
                            currentTrace.push(trace[i]);
                            break;
                        default:
                            if(currentTrace.length>0)splitedTraces.push(currentTrace);
                            currentTrace = [trace[i]];
                            currentTrace.lineType = 'over';
                    }
                }
                else{
                    switch(currentTrace.lineType){
                        case 'normal':
                            currentTrace.push(trace[i]);
                            break;
                        default:
                            if(currentTrace.length>0)splitedTraces.push(currentTrace);
                            currentTrace = [trace[i]];
                            currentTrace.lineType = 'normal';
                    }
                }
                // 最后一个点
                if(i==len-1){
                    splitedTraces.push(currentTrace);
                }
            }
            // 2.生成新的轨迹线
            let newTraces = [];
            for(let i=0,len=splitedTraces.length;i<len;i++){
                const currentPoint = splitedTraces[i][0];
                // 第一段用后面的点补线
                if(i==0){
                    if(splitedTraces.length>1){
                        const nextTrace = splitedTraces[i+1];
                        const nextPoint = nextTrace[0];
                        const addedPoint = nextPoint;
                        splitedTraces[i].push(addedPoint);
                    }
                }
                // 第二段且第一段只有一个点，用中间点补线
                else if(i==1 && splitedTraces[0].length==0){
                    const lastTrace = splitedTraces[0];
                    const lastPoint = lastTrace[lastTrace.length-1];
                    const addedPoint = {
                        ...lastPoint,
                        longitudeDone:(lastPoint.longitudeDone+currentPoint.longitudeDone)/2,
                        latitudeDone:(lastPoint.latitudeDone+currentPoint.latitudeDone)/2,
                    };
                    splitedTraces[i].unshift(addedPoint);
                }
                // 非第一段用前面的点补线
                else{
                    const lastTrace = splitedTraces[i-1];
                    const lastPoint = lastTrace[lastTrace.length-1];
                    const addedPoint = lastPoint;
                    splitedTraces[i].unshift(addedPoint);
                }

                newTraces.push({
                    id:`line-${i}`,
                    paths:splitedTraces[i].map(item=>[item.longitudeDone,item.latitudeDone]),
                    config:{
                        lineWidth:3,
                        color:lineColorMap[splitedTraces[i].lineType]
                    }
                });
            }
            return newTraces;
        }
        // 点位小于两个，不画线
        if(carPositions.length<2){
            return [];
        }
        else{
            // 历史轨迹开启报警分段
            if(pathAlarmSetting.on){
                return guiJiFenDuan(carPositions,pathAlarmSetting.speedLimit);
            }
            // 历史轨迹未开启报警分段
            else{
                return [{
                    id:`line-${carPositions[0].id}`,
                    paths:carPositions.map(item=>[item.longitudeDone,item.latitudeDone]),
                    config:{
                        lineWidth:3,
                        color:'#1DA362'
                    }
                }]
            }
        }
    }
    // 生成地图停车点位数据
    genMapPointsForStopCar(){
        return this.props.carStopInfo.map((item,index)=>{
            return {
                id:`stopcar-${index}`,    
                latitude:item.latitudeDone,
                longitude:item.longitudeDone,
                url: GPS_ICON.map.carStop,
                pointType:'stopCar',
                config:{
                    width:33,
                    height:33,
                    markerContentX:-16,
                    markerContentY:-16,
                }
            }
        })
    }
    // 生成地图加油点位数据
    genMapPointsForRefuelingPoints(){
        return this.props.refuelingPoints.map((item,index)=>{
            return {
                id:item.id,    
                latitude:item.latitudeDone,
                longitude:item.longitudeDone,
                url: GPS_ICON.map.refueling,
                pointType:'carRefueling',
                config:{
                    width:32,
                    height:38,
                    markerContentX:-16,
                    markerContentY:-38,
                }
            }
        })
    }
    // 生成地图异常点位数据
    genMapPointsForAbnormalPoints(){
        return this.props.abnormalPoints.map((item,index)=>{
            return {
                id:item.id,    
                latitude:item.latitudeDone,
                longitude:item.longitudeDone,
                url: GPS_ICON.map.abnormal,
                pointType:'carAbnormal',
                config:{
                    width:32,
                    height:38,
                    markerContentX:-16,
                    markerContentY:-38,
                }
            }
        })
    }
    // 生成已选中车辆实时点位
    genMapPointForSelectedPos(){
        const {carPositions,selectedCarPositionIndex} = this.props
        if(typeof selectedCarPositionIndex=='number' && carPositions[selectedCarPositionIndex]){
            const posInfo = carPositions[selectedCarPositionIndex];
            return [{
                id:'selectedCarPos',
                latitude:posInfo.latitudeDone,
                longitude:posInfo.longitudeDone,
                url: GPS_ICON.map.selectedPosition,
                pointType:'selectedPos',
                config:{
                    width:13,
                    height:21,
                    markerContentX:-7,
                    markerContentY:-21,
                }
            }]
        }
        else{
            return [];
        }
    }
    // 生成已选中车辆停车点位
    genMapPointForSelectedStopCar(){
        const {carStopInfo,selectedStopCarIndex} = this.props
        if(typeof selectedStopCarIndex=='number' && carStopInfo[selectedStopCarIndex]){
            const posInfo = carStopInfo[selectedStopCarIndex];
            return [{
                id:'selectedStopCar',
                latitude:posInfo.latitudeDone,
                longitude:posInfo.longitudeDone,
                url: GPS_ICON.map.selectedStopCar,
                pointType:'selectedStopCar',
                config:{
                    width:33,
                    height:33,
                    markerContentX:-16,
                    markerContentY:-16,
                    zIndex:1
                }
            }]
        }
        else{
            return [];
        }
    }
    // 生成历史轨迹首尾两点
    genHeadTailPoints(){
        const {carPositions} = this.props;
        if(carPositions.length>=2){
            const head = carPositions[0];
            const tail = carPositions[carPositions.length-1];
            return [{
                id:'startPoint',
                latitude: head.latitudeDone,
                longitude: head.longitudeDone,
                url: GPS_ICON.map.startPoint,
                pointType:'startPoint',
                config:{
                    width:22,
                    height:31,
                    markerContentX:-11,
                    markerContentY:-31,
                }
            },{
                id:'endPoint',
                latitude: tail.latitudeDone,
                longitude: tail.longitudeDone,
                url: GPS_ICON.map.endPoint,
                pointType:'endPoint',
                config:{
                    width:22,
                    height:31,
                    markerContentX:-11,
                    markerContentY:-31,
                }
            }]
        }
        else{
            return [];
        }
    }
    updateModel(obj){
        this.props.dispatch({
            type:'history/save',
            payload:obj
        });
    }
    render(){
        const t = this;
        const {dispatch,carTreeSearchCfg,mapCfg,bkCfg,leftPanelCfg,trackQueryForm,
            toolboxCfg,carPositions,carPlayCfg,bottomPanelCfg,gasStation,repairShop,
            showHistoryPath,showStopCar,carStopInfo,stopTimeInterval,
            selectedCarPositionIndex,selectedArea,loading,selectedRefuelingId,
            selectedAbnormalId,selectedGasStationId,refuelingPoints,abnormalPoints,
            selectMode,pathAlarmSetting} = this.props;

        // 地图配置变动
        let newMapCfg = {
            drawEnd(obj){
                t.updateModel({
                    mapCfg:{
                        isDraw:false,
                    },
                    selectedArea:{
                        elemId:'selectArea',
                        show:true,
                        startTime:VtxTime.operationTime({format:'YYYY-MM-DD HH:mm:ss',type:'subtract',num:2,dateType:'h'}),
                        endTime:VtxTime.getFormatTime({format:'YYYY-MM-DD HH:mm:ss'}),
                        locations:`${obj.lnglatAry[3].lngX},${obj.lnglatAry[3].latX};${obj.lnglatAry[1].lngX},${obj.lnglatAry[1].latX}`,
                    }
                });
            },
            clickGraphic(obj){
                if(obj.type=='point'){
                    t.clickMapPoint(obj.attributes);
                }
            }
        };
        // 合并地图参数
        merge(newMapCfg,mapCfg);

        // 关注区增加图元
        const focusAreaMapElems = t.focusAreaDataProcessor();
        merge(newMapCfg,focusAreaMapElems);
        
        merge(newMapCfg,{
            mapPoints:[
                ...t.genMapPointsForRefuelingPoints(),
                ...t.genMapPointsForAbnormalPoints()
            ]
        });
        // 是否显示加油站
        if(t.getToolBarStateById('gasStation','selected')){
            merge(newMapCfg,{
                mapPoints:gasStation.points
            });
        }
        // 是否显示维修厂
        if(t.getToolBarStateById('repairShop','selected')){
            merge(newMapCfg,{
                mapPoints:repairShop.points
            });
        }
        // 是否显示历史轨迹线以及首尾点
        if(showHistoryPath){
            merge(newMapCfg,{
                mapLines:t.genHistoryLines(),
                mapPoints:t.genHeadTailPoints(),
            });
        }
        // 是否显示停车点位
        if(showStopCar){
            merge(newMapCfg,{
                mapPoints:t.genMapPointsForStopCar()
            });
        }
        // 显示已选中的车辆实时点位
        if(!carPlayCfg.isPlaying){
            merge(newMapCfg,{
                mapPoints:t.genMapPointForSelectedPos()
            });
        }
        // 显示已选中的停车点位
        merge(newMapCfg,{
            mapPoints:t.genMapPointForSelectedStopCar()
        });
        // 是否显示比例尺
        if(bkCfg.isShowScale){
            newMapCfg.showControl = {
                location:'bl',
                type:'all'
            }
        }
        
        // 1.地图组件参数
        let mapProps ={
            data:{
                mapCfg:newMapCfg,
                carPositions,
                carPlayCfg,

            },
            updateM:t.updateModel.bind(t),
            // 控制车辆轨迹表格滚动的位置，配合地图的播放功能
            tableScrollToIndex(index){
                t.bottomPanelInstance.scrollCarPositionTableToIndex(index);
                t.leftPanelInstance.switchDetailPn('carPosition');
                t.leftPanelInstance.detailPnToggle('open');
                t.updateModel({
                    selectedCarPositionIndex:index
                })
            },
        };
        
        
        // 2.查询框参数
        const searchInputProps = {
            data:{
                ...carTreeSearchCfg,
            },
            // 更改搜索类型
            changeSearchWay(val){
                t.updateModel({
                    carTreeSearchCfg:{
                        searchWay:val,
                        searchVal:'',
                        searchList:[]
                    }
                });
            },
            // 更改搜索值
            changeSearchValue(val){
                t.updateModel({
                    carTreeSearchCfg:{searchVal:val}
                });
            },
            // 模糊搜索
            fuzzySearch(val){
                dispatch({
                    type:'history/getSearchOption',
                    payload:{
                        search:val
                    }
                });
            },
            search: t.search.bind(t)
        }

        // 左侧面板数据
        const leftPanelProps = {
            data:{
                ...leftPanelCfg,
                trackQueryForm,
                carPositions,
                selectedCarPositionIndex,
                selectedRefuelingInfo:refuelingPoints.filter((item)=>item.id===selectedRefuelingId).pop()||{},
                selectedAbnormalInfo:abnormalPoints.filter((item)=>item.id===selectedAbnormalId).pop()||{},
                selectedGasStation:gasStation.points.filter((item)=>item.id===selectedGasStationId).pop()||{},
            },
            // 树配置项选择
            treeCfgSelect(menuIndex, menuOptionIndex){
                dispatch({
                    type:'history/updateTreeCfg',
                    payload:{
                        menuIndex,
                        menuOptionIndex
                    }
                });
                // “作业单位”触发查询
                if(['treeType'].indexOf(leftPanelCfg.treeConfig[menuIndex].id)!=-1){
                    t.search();
                }
            },
            // 选择车辆
            selectCar(carInfo){
                t.updateModel({
                    trackQueryForm:{
                        selectedCarInfo:carInfo
                    }
                });
            },
            // 查询轨迹
            searchCarPath(){
                dispatch({
                    type:'history/searchByCarTimeSlot'
                });
            },
            update:t.updateModel.bind(t),
        }

        // 底部面板
        const bottomPanelProps = {
            data:{
                ...bottomPanelCfg,
                carPositions,
                carStopInfo,
                showStopCar,
                stopTimeInterval,
                selectedCarPositionIndex,
                showOilTab:bkCfg.isOil,
                showAlarmTab:bkCfg.isShowAlarm,
                detail:{
                    columns:[
                        {label: "车牌号", dataKey:'carCode'},
                        {label: "GPS状态", dataKey:'carStatus'},
                        {label: "速度(km/h)", dataKey:'speed'},
                        {label: "上报时间", dataKey:'equipmentTime'},
                        {label: "参考位置", dataKey:'address',width:420}
                    ],
                },
                alarm:{
                    columns:[
                        {label: "车牌号", dataKey:'carCode'},
                        {label: "报警类型", dataKey:'alarmStrategyName'},
                        {label: "报警开始时间", dataKey:'alarmStartTime',width:150},
                        {label: "报警结束时间", dataKey:'alarmEndTime',width:150},
                        {label: "报警等级", dataKey:'alarmLevelName'},
                        {label: "参考位置", dataKey:'address',width:400}
                    ]
                },
                stop:{
                    columns:[
                        {label: "开始时间", dataKey:'startTime'},
                        {label: "结束时间", dataKey:'endTime',},
                        {label: "停车时长", dataKey:'stopTimeStr'},
                        {label: "停车位置", dataKey:'address',width:450}
                    ]
                }
            },
            // 获取车辆实际地址
            fetchAddressForCarPositions(startIndex,endIndex){
                dispatch({
                    type:'history/getAddressForCarPositions',
                    payload:{
                        startIndex,endIndex
                    }
                });
            },
            // 点击停车记录
            clickStopCar(index){
                t.updateModel({
                    selectedStopCarIndex:index,
                })
                dispatch({
                    type:'history/setMapZoomCenter',
                    payload:{
                        center:[carStopInfo[index].longitudeDone,carStopInfo[index].latitudeDone]
                    }
                });
            },
            // 点击车辆轨迹记录
            clickCarPath(index){
                // 轨迹播放时忽略点击事件
                if(!carPlayCfg.isPlaying){
                    t.leftPanelInstance.detailPnToggle('open');
                    t.leftPanelInstance.switchDetailPn('carPosition');
                    t.updateModel({
                        selectedCarPositionIndex:index,
                    })
                    dispatch({
                        type:'history/setMapZoomCenter',
                        payload:{
                            center:[carPositions[index].longitudeDone,carPositions[index].latitudeDone]
                        }
                    });
                }
            },
            // 更新停车间隔时间
            updateStopTimeInterval(val){
                t.updateModel({
                    stopTimeInterval:val
                })
            },
            // 查询停车列表
            queryStopList(){
                dispatch({
                    type:'history/getCarStopInfo'
                });
            }
        }

        // 工具栏
        const toolBoxProps = {
            data:{
                toolboxCfg,
            },
            menuSelect(menuIndex,optIndex){
                t.toolBoxSelect(menuIndex,optIndex);
            }
        }

        // 车辆播放面板
        const carPlayProps = {
            data:{
                ...carPlayCfg,
                playable:carPositions.length>0,
            },
            updateM:t.updateModel.bind(t),
            play(){
                t.updateModel({
                    carPlayCfg:{
                        isPlaying:true
                    }
                });
                t.map.play();
            },
            pause(){
                t.map.pause();
            },
            stop(){      
                t.map.stop(); 
            },
            switchTimeSlot(slotIndex){
                if(slotIndex!==carPlayCfg.selectedSplitTimeIndex){
                    dispatch({
                        type:'history/searchByCarTimeSlot',
                        payload:{
                            timeSlotIndex:slotIndex
                        }
                    });
                }
            }
        }

        return (
            
            <div className={`${style.rm} ${bkCfg.isNarrow?style.narrowLeft:''}`}>
                {
                    mapCfg.mapType?<TrackMap {...mapProps} ref={(inst)=>{if(inst)t.map=inst}}/>:null
                }
                
                <SearchInput {...searchInputProps}/>
                <LeftPanel {...leftPanelProps} ref={(ins)=>{if(ins)t.leftPanelInstance = ins}}/>
                <BottomPanel {...bottomPanelProps} ref={(ins)=>{if(ins)t.bottomPanelInstance = ins;}}/>
                <ToolBox {...toolBoxProps}/>
                <CarPlayControl {...carPlayProps}/>
                {
                    loading?<Loading/>:null
                }
                {
                    selectMode?<Button className={style.exitModeBt} type='primary' onClick={()=>{
                        t.search();
                    }}>退出框选模式</Button>:null
                }
                <VtxModal key="selectArea"
                    title='框选区域车辆'
                    visible={selectedArea.show}
                    width={500}
                    onOk={()=>{
                        dispatch({
                            type:'history/getCarTreeBySelectedArea'
                        }); 
                        t.updateModel({
                            selectMode:true,
                            selectedArea:{
                                show:false
                            }
                        })
                    }}
                    onCancel={()=>{
                        t.updateModel({
                            selectedArea:{
                                show:false
                            }
                        })
                        t.clearSelectArea();
                    }}
                >
                    <VtxModalList visible={true}>
                        <VtxDatePicker value={selectedArea.startTime} onChange={(val)=>{
                                t.updateModel({
                                    selectedArea:{
                                        startTime:val
                                    }
                                })
                            }} showTime={true} data-modallist={{layout:{
                                name:'开始时间',
                                width:90
                        }}}/>
                        <VtxDatePicker value={selectedArea.endTime} onChange={(val)=>{
                            t.updateModel({
                                selectedArea:{
                                    endTime:val
                                }
                            })
                        }} showTime={true} data-modallist={{layout:{
                            name:'结束时间',
                            width:90
                        }}}/>
                    </VtxModalList>
                </VtxModal>

                <VtxModal key="alarmSpeed"
                    title='设置轨迹速度报警'
                    visible={pathAlarmSetting.show}
                    width={500}
                    onOk={()=>{
                        t.updateModel({
                            pathAlarmSetting:{
                                show:false,
                                on:pathAlarmSetting.onTemp,
                                speedLimit:pathAlarmSetting.speedTemp
                            }
                        })
                    }}
                    onCancel={()=>{
                        t.updateModel({
                            pathAlarmSetting:{
                                show:false,
                                onTemp:pathAlarmSetting.on,
                                speedTemp:pathAlarmSetting.speedLimit
                            }
                        })
                    }}
                >
                    <div style={{padding:'5px 10px'}}>
                        <span style={{marginRight:'10px'}}>轨迹速度报警:</span>
                        <Switch checkedChildren="开" unCheckedChildren="关"
                        checked={pathAlarmSetting.onTemp} onChange={(val)=>{
                            t.updateModel({
                                pathAlarmSetting:{
                                    onTemp:val
                                }
                            })
                        }}/>
                    </div>
                    <div style={{padding:'5px 10px'}}>
                        <span style={{marginRight:'10px'}}>报警速度阈值:</span>
                        
                        <Input  style={{width:'50px'}}  value={pathAlarmSetting.speedTemp} onChange={(e)=>{
                            const val = e.target.value;
                            if(isNaN(Number(val)))return;
                            t.updateModel({
                                pathAlarmSetting:{
                                    speedTemp: Number(val)
                                }
                            })
                        }}/>km/h 
                        <div>(小于此速度为绿色轨迹线，大于此速度为红色轨迹线)</div>
                    </div>
                    
                    
                </VtxModal>
                
            </div>
            
        )
    }
}

export default connect(({history})=>history)(GPSHistory);