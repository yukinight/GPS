import React from 'react';
import {connect} from 'dva';
import {VtxMap,VtxModal,VtxZtree} from 'vtx-ui';
import {Input,Select,message,Button} from 'antd';
import SearchInput from './searchInput';
import LeftPanel from './leftPanel';
import BottomPanel from './bottomPanel';
import ToolBox from './toolBox';
import LegendBox from './legendBox';
import CarStatistics from './carStatistics';
import style from './index.less';

import {GPS_ICON} from '../../utils/iconMap';
import {strToColor} from '../../utils/util';

const {VtxOptMap} = VtxMap;
const {Option} = Select;

class RealTime extends React.Component {
    constructor(props){
        super(props);
        this.map = null;//地图实例
        this.leftPanelInstance = null; //左侧面板实例
        this.bottomPanelInstance = null; //底部面板实例
        this.refresh = null;//页面刷新定时器

        // 事件函数绑定this
        this.updateModel = this.updateModel.bind(this);
        this.drawMarkPointEnd = this.drawMarkPointEnd.bind(this);
        this.search = this.search.bind(this);
        this.carIsTracking = this.carIsTracking.bind(this);
        this.openMsgWindow = this.openMsgWindow.bind(this);
    }
    componentDidMount(){
        const {dispatch} = this.props;
        // 获取通用配置
        Promise.all([
            dispatch({type:'realTime/getGPSConfig'}),
            dispatch({type:'common/getTenantInfo'}),
        ]).then(()=>{
            // 获取车辆树(树的勾选状态需要等待配置返回才能确定)
            dispatch({type:'realTime/getCarTree',payload:{initial:true}});
            // 获取关注区列表
            dispatch({type:'realTime/getFocusAreaList'});
            // 设置中心点
            dispatch({type:'realTime/setMapCfg'});
            // 获取车辆点位
            dispatch({type:'realTime/getCarPoints'});
        });
        
        // 获取地图图例信息
        dispatch({type:'realTime/getMapIcons'});
        
        this.setRefreshTimer();
    }
    componentWillUnmount(){
        clearInterval(this.refresh);
    }
    // 车辆实时数据,树查询
    search(){
        const {dispatch,pageStatus} = this.props;
        dispatch({type:'realTime/getCarTree'});
        if(pageStatus=='normal'){
            dispatch({type:'realTime/getCarPoints'});
        }
    }
    // 跟踪模式下刷新数据
    refreshTrackData(){
        this.props.dispatch({
            type:'realTime/getTrackData'
        })
    }
    updateModel(obj){
        this.props.dispatch({
            type:'realTime/save',
            payload:{
                ...obj
            }
        });
    }
    //选中车辆 
    pickOneCar(obj){
        const t = this;
        this.props.dispatch({
            type:'realTime/pickOneCar',
            payload:{
                ...obj,
                isOilTab:t.bottomPanelInstance.isOilTab(),
                calPointsDistance(p1,p2){
                    return t.map.calculatePointsDistance(p1,p2);
                }
            }
        });
        // 打开车辆详情面板
        this.leftPanelInstance.detailPnToggle('open');
    }
    // 选中加油站
    pickGasStation(gasId){
        this.props.dispatch({
            type:'realTime/save',
            payload:{
                currentClickPoint:{
                    id:gasId,
                    pType:'gasStation'
                }
            }
        })
        this.leftPanelInstance.detailPnToggle('open');
    }
    // 进入跟踪模式
    startTrack(mode='track-s'){
        this.refreshTrackData();
        this.updateModel({
            pageStatus:mode,
        })
    }
    // 添加新的跟踪车辆
    addTrack(carIds){
        this.props.dispatch({
            type:'realTime/addTrackCar',
            payload:{
                carIds,
            }
        });
    }
    // 清空已有跟踪数据
    clearTrack(){
        this.props.dispatch({
            type:'realTime/clearTrack',
        })
    }
    // 退出跟踪模式
    stopTrack(){
        this.props.dispatch({
            type:'realTime/stopTrack'
        })
        this.search();
    }
    // 重新设置页面自动刷新频率
    setRefreshTimer(refreshInterval){
        const t = this;
        if(!refreshInterval){
            refreshInterval = this.props.refreshInterval;
        }
        else{
            this.updateModel({
                refreshInterval:refreshInterval
            })
        }
        if(this.refresh){
            clearInterval(this.refresh);
        }
        this.refresh = setInterval(()=>{
            if(t.props.pageStatus=='normal'){
                t.search();
            }
            else{
                t.refreshTrackData();
            }
        },refreshInterval*1000);
    }
    // 判断车是否在被跟踪
    carIsTracking(carId){
        const {pageStatus,trackCfg} = this.props;
        if(pageStatus!='normal' && trackCfg.trackPointsId.indexOf(carId)!=-1){
            return true;
        }
        else{
            return false;
        }
    }
    // 清空，清空地图所有图元，清空关注区和图层的选择
    clearAll(){
        const {dispatch} = this.props;
        // this.map.clearAll();
        // 清除关注区勾选
        dispatch({
            type:'realTime/updateToolBar',
            payload:{
                opWay:'clear',
                menuId:'focusArea'
            }
        })
        // 清除地图图层的勾选
        dispatch({
            type:'realTime/updateToolBar',
            payload:{
                opWay:'clear',
                menuId:'mapLayer'
            }
        })
        // 执行地图清空操作
        dispatch({
            type:'realTime/save',
            payload:{
                mapCfg:{
                    isClearAll:true
                }
            }
        })
        setTimeout(()=>{
            dispatch({
                type:'realTime/save',
                payload:{
                    mapCfg:{
                        isClearAll:false
                    }
                }
            })
        },50)
    }
    // 打开调度信息窗口
    openMsgWindow(carId){
        const thisCarInfo = this.props.carsInfo[carId];
        if(this.props.bkCfg.dispatchType == 'sms'){
            if(!thisCarInfo.driverPhone){
                message.warn('无法获取车辆责任人联系方式');
                return;
            }
            if(!this.props.bkCfg.smsTemplate){
                message.warn('没有配置模板内容');
                return;
            }
        }
        this.updateModel({
            sendMsgWindow:{
                show:true,
                carId
            }
        })
    }
    // 清空调度信息弹窗填写数据
    clearMsgInfo(){
        this.updateModel({
            sendMsgWindow:{
                msg:'',
                templateMsg:this.props.sendMsgWindow.templateMsg.map(msg=>'')
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
    // 选择关注区
    selectFocusArea(areaIndex,menuIndex){
        const selectedArea = this.props.toolboxCfg[menuIndex].children[areaIndex];
        if(!selectedArea.selected){
            this.props.dispatch({
                type:'realTime/getFocusAreaDetail',
                payload:{
                    areaId:selectedArea.id
                }
            })
        }
        this.props.dispatch({
            type:'realTime/updateToolBar',
            payload:{
                opWay:'toggle',
                menuIndex,
                subMenuIndex:areaIndex
            }
        })
        // this.updateModel({
        //     toolboxCfg:{
        //         [menuIndex]:{
        //             children:{
        //                 [areaIndex]:{
        //                     selected:!selectedArea.selected
        //                 }
        //             }
        //         }
        //     }
        // })
    }
    // 工具栏点击后的操作
    toolBoxSelect(menuIndex,optIndex){
        const t = this;
        const menuId = t.props.toolboxCfg[menuIndex].id,
        optionId = t.props.toolboxCfg[menuIndex].children[optIndex].id
        switch(optionId){
            case 'legend'://显示图例
                t.updateModel({
                    showLegend:true
                })
                break;
            case 'clearAll'://清空地图图元，关注区，图层清空
                this.clearAll();
                break;
            case 'ranging'://开启测距
                this.map.vtxRangingTool();
                break;
            case 'mark'://添加标记点位
                this.updateModel({
                    mapCfg:{isDraw:true}
                })
                setTimeout(()=>{
                    this.updateModel({
                        mapCfg:{isDraw:false}
                    })
                },50)
                break;
            case 'setRefresh'://设置刷新频率
                this.updateModel({
                    refreshWindow:{show:true}
                })
                break;
            case 'autoZoom'://是否打开自动缩放
                this.updateModel({
                    autoZoom:!this.props.autoZoom
                })
                break;
            case 'hideCarCode'://是否隐藏车牌号
                this.updateModel({
                    hideCarCode:!this.props.hideCarCode
                })
                break;
            case 'batchTrack'://批量跟踪
                if(this.props.pageStatus!='track-m'){
                    this.updateModel({
                        batchTrackWindow:{show:true}
                    })
                }
                else{
                    this.stopTrack();
                }
                break;
            case 'gasStation'://是否显示加油站
                const gasStationSelected = this.getToolBarStateById('gasStation','selected');
                this.props.dispatch({
                    type:'realTime/updateToolBar',
                    payload:{
                        menuId:'mapLayer',
                        subMenuId:'gasStation',
                        opWay:'toggle'
                    }
                });
                if(!gasStationSelected){
                    this.props.dispatch({
                        type:'realTime/getGasStation'
                    });
                }
                break;
            case 'repairShop'://是否显示维修厂
                const repairShopSelected = this.getToolBarStateById('repairShop','selected');
                this.props.dispatch({
                    type:'realTime/updateToolBar',
                    payload:{
                        menuId:'mapLayer',
                        subMenuId:'repairShop',
                        opWay:'toggle'
                    }
                });
                if(!repairShopSelected){
                    this.props.dispatch({
                        type:'realTime/getRepairShop'
                    });
                }
                break;
        }
        // 关注区点击处理
        if(menuId=='focusArea'){
            this.selectFocusArea(optIndex,menuIndex);
        }
    }
    // 生成地图点位
    generateMapCarPoints(carIds){
        const {leftPanelCfg,carsInfo,refreshInterval,hideCarCode,bkCfg,carIcons} = this.props;
        const carStatusIcon = {
            '行驶在线': GPS_ICON.map.carOn,
            '停车在线': GPS_ICON.map.carStop,
            '离线': GPS_ICON.map.carOff,
        }
        const carStatusMapping = {
            '行驶在线': 'carMapRightOnline',
            '停车在线': 'carTreePark',
            '离线': 'carTreeOffline',
        }
        const labelClass = (()=>{
            if(hideCarCode){
                return style.noLabel;
            }
            return bkCfg.isShowCarClasses?style.widePointLabel:style.pointLabel;
        })();
        // 地图点位排序按上报时间
        return (carIds||leftPanelCfg.selectedNodes).filter((id)=>id in carsInfo).map((id)=>carsInfo[id]).sort((a,b)=>{
            return a.equipmentTime < b.equipmentTime?1:-1;
        }).map((item)=>{
            // 车头向右的图标
            const carIconUrl = carIcons[item.carClassesCode] && carIcons[item.carClassesCode][carStatusMapping[item.carStatus]||'NEWSTATUS'] ? 
            carIcons[item.carClassesCode][carStatusMapping[item.carStatus]] :
            carStatusIcon[item.carStatus];
            // 车头向左的图标,只有车辆在线时的移动动画需要
            const carLeftIconUrl = item.carStatus=='行驶在线' && carIcons[item.carClassesCode] && carIcons[item.carClassesCode]['carMapLeftOnline'] ?
            carIcons[item.carClassesCode]['carMapLeftOnline'] : null;
            return {
                id:item.carId,
                latitude:item.latitudeDone,
                longitude:item.longitudeDone,
                canShowLabel:true,
                labelClass,
                url: carIconUrl,
                urlleft: carLeftIconUrl,
                pointType:'car',
                config:{
                    width:30,
                    height:30,
                    markerContentX:-15,
                    markerContentY:-15,
                    isAnimation:true,
                    animationDelay:5,
                    autoRotation:  item.carStatus=='行驶在线',
                    labelContent:bkCfg.isShowCarClasses?`${item.carCode} ${item.carClassesName}`:item.carCode
                }
            }
        })
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
                                });''.pa
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
    // 工具栏配置根据状态实时切换
    genToolBoxCfg(){
        const {toolboxCfg,hideCarCode,autoZoom,pageStatus,repairShop,gasStation} = this.props;
        return toolboxCfg.map((menu)=>{
            if(menu.id=='setting'){
                return {
                    ...menu,
                    children:menu.children.map((opt)=>{
                        switch(opt.id){
                            case 'autoZoom':
                                return {
                                    ...opt,
                                    name:autoZoom?'关闭自动缩放':'打开自动缩放'
                                }
                                break;
                            case 'hideCarCode':
                                return {
                                    ...opt,
                                    name:hideCarCode?'显示车牌号':'隐藏车牌号'
                                }
                                break;
                            case 'batchTrack':
                                return {
                                    ...opt,
                                    name:pageStatus=='track-m'?'关闭批量跟踪':'开始批量跟踪'
                                }
                                break;
                            default:
                                return opt
                        }
                    })
                }
            }
            else{
                return menu
            }
        })
    }
    // 根据开关控制实时表格展示的列
    genRealDataColumns(){
        const {bkCfg} = this.props;
        return [
            // {label: "自编号", dataKey:'groupCode'},
            {label: "车牌号", dataKey:'carCode'},
            {label: "GPS状态", dataKey:'carStatus'},
            {label: "速度(km/h)", dataKey:'speed'},
            {label: "转速(RPM)", dataKey:'analog0'},
            {label: "当日油耗(L)", dataKey:'consumeOil'},
            {label: "当前油量(L)", dataKey:'oilMass'},
            {label: "当日里程(km)", dataKey:'sumMileage'},
            {label: "上传时间", dataKey:'equipmentTime',width:120},
            {label: "参考位置", dataKey:'currentAddress',width:360},
        ].filter(item=>{
            // 不显示油量信息
            if(!bkCfg.isOil){
                if(item.dataKey=='consumeOil' || item.dataKey=='oilMass'){
                    return false;
                }
            }
            // 不显示转速
            if(!bkCfg.showRpm && item.dataKey=='analog0'){
                return false
            }
            return true;
        })
    }
    // 标记点位
    drawMarkPointEnd(pointInfo){
        this.updateModel({
            markWindow:{
                show:true,
                pointInfo:{
                    id:pointInfo.id,
                    latitude:pointInfo.geometry.y,
                    longitude:pointInfo.geometry.x,
                    canShowLabel:true,
                    config:{
                        width:30,
                        height:30,
                        markerContentX:-15,
                        markerContentY:-15,
                        labelContent:''
                    }
                }
            }
        })
    }
    render(){
        const {dispatch,searchCfg,mapCfg,leftPanelCfg,currentClickPoint,
            carsInfo,bottomPanelCfg, pageStatus,refreshInterval,trackCfg,
            toolboxCfg,refreshWindow,batchTrackWindow,showLegend,
            markWindow,repairShop,gasStation,carStatistics,bkCfg,
            sendMsgWindow,videoCfg,showStatistics,carIcons} = this.props;
        const t = this;

        // 1.地图参数: 车辆，跟踪路线，关注区图层，加油站维修厂等设施
        const realTimeCarPoints = t.generateMapCarPoints();
        const trackedPoints = t.generateMapCarPoints(trackCfg.trackPointsId);
        const trackedLines = trackCfg.trackPointsId.filter((id)=>id in trackCfg.trackLines).map((id)=>trackCfg.trackLines[id]);
        const clickedPoint = currentClickPoint.id && leftPanelCfg.selectedNodes.indexOf(currentClickPoint.id)!=-1?t.generateMapCarPoints([currentClickPoint.id]):[];
        const focusAreaMapElems = t.focusAreaDataProcessor();

        let mapProps ={
            ...mapCfg,
            mapLines:[],
            mapPoints:[],
            ...focusAreaMapElems,
            reservedPoints:[],
            mapDraw:{...mapCfg.mapDraw},
            drawEnd:t.drawMarkPointEnd,
            clickGraphic(obj){
                if(obj.type=='point'){
                    switch(obj.attributes.pointType){
                        case 'car':
                            t.pickOneCar({carId:obj.attributes.id});
                            break;
                        case 'gasStation':
                            t.pickGasStation(obj.attributes.id);
                            break;
                    }
                   
                }
            }
        };
        // 实时点位
        if(pageStatus=='normal'){
            mapProps.mapPoints = [...mapProps.mapPoints,...realTimeCarPoints];
            mapProps.reservedPoints = clickedPoint;
        }
        // 车辆跟踪
        else{
            mapProps.reservedPoints = trackedPoints;
            mapProps.mapLines = [...mapProps.mapLines, ...trackedLines];
        }
        // 是否显示加油站
        if(t.getToolBarStateById('gasStation','selected'))mapProps.mapPoints = [...mapProps.mapPoints,...gasStation.points];
        // 是否显示维修厂
        if(t.getToolBarStateById('repairShop','selected'))mapProps.mapPoints = [...mapProps.mapPoints,...repairShop.points];
        // 是否显示比例尺
        if(bkCfg.isShowScale){
            mapProps.showControl = {
                location:'bl',
                type:'all'
            }
        }  

        // 2.查询框参数
        const searchInputProps = {
            data:{
                ...searchCfg,
            },
            // 更改搜索类型
            changeSearchWay(val){
                t.updateModel({
                    searchCfg:{
                        searchWay:val,
                        searchVal:'',
                        searchList:[]
                    }
                });
            },
            // 更改搜索值
            changeSearchValue(val){
                t.updateModel({
                    searchCfg:{searchVal:val}
                });
            },
            // 模糊搜索
            fuzzySearch(val){
                // t.updateModel({
                //     search:val
                // });
                dispatch({
                    type:'realTime/getSearchOption',
                    payload:{
                        search:val
                    }
                });
            },
            search: t.search
        }
        // 左侧面板数据
        const leftPanelProps = {
            data:{
                ...leftPanelCfg,
                currentClickPoint,
                carsInfo,
                pageStatus,
                trackCfg,
                gasStation,
                bkCfg,
                videoCfg
            },
            // 树配置项选择
            treeCfgSelect(menuIndex, menuOptionIndex){
                dispatch({
                    type:'realTime/updateTreeCfg',
                    payload:{
                        menuIndex,
                        menuOptionIndex
                    }
                });
                // “状态过滤”和“作业单位”触发查询
                if(['carStatus','treeType'].indexOf(leftPanelCfg.treeConfig[menuIndex].id)!=-1){
                    t.search();
                }
            },
            pickOneCar(carId){
                t.pickOneCar({carId,moveMap:true});   
            },
            trackOneCar(carId){
                if(pageStatus=='track-s'){
                    t.clearTrack();
                    t.addTrack([carId]);
                    t.refreshTrackData();
                }
                else{
                    t.clearTrack();
                    t.addTrack([carId])
                    t.startTrack('track-s');
                }
            },
            stopTrack(){
                t.stopTrack();
            },
            carIsTracking:t.carIsTracking,
            openMsgWindow:t.openMsgWindow,
            selectCars(carIds){
                dispatch({
                    type:'realTime/selectCars',
                    payload:{
                        carIds
                    }
                });
            },
            update:t.updateModel,
            getVideo(carId){
                dispatch({
                    type:'realTime/showVideo',
                    payload:{
                        carId
                    }
                });
            },
            closeVideo(){
                dispatch({
                    type:'realTime/save',
                    payload:{
                        videoCfg:{
                            carId:'',
                            videoAddress:videoCfg.videoAddress.map(item=>''),
                            showVideo:false,
                        }
                    }
                });
            }
        }

        // 底部面板
        const bottomPanelProps = {
            data:{
                pageStatus,
                currentClickPoint,
                carsInfo,
                ...bottomPanelCfg,
                trackCfg,
                carStatistics,
                bkCfg,
                realDataCfg:{
                    carIds:realTimeCarPoints.map((point)=>point.id),
                    columns: t.genRealDataColumns()
                },
                
                alarmInfoCfg:{
                    alarmData:bottomPanelCfg.alarmData.filter((item)=>leftPanelCfg.selectedNodes.indexOf(item.carId)!=-1),
                    columns:[
                        {label: "车牌号", dataKey:'carCode'},
                        {label: "报警类型", dataKey:'alarmStrategyName'},
                        {label: "报警开始时间", dataKey:'alarmStartTime',width:120},
                        {label: "报警结束时间", dataKey:'alarmEndTime',width:120},
                        {label: "报警等级", dataKey:'alarmLevelName'},
                        {label: "参考位置", dataKey:'address',width:360}
                    ]
                }
            },
            pickOneCar(carId){
                t.pickOneCar({carId,moveMap:true});   
            },
            getOilLine(){
                dispatch({
                    type:'realTime/getCarOilData',
                    payload:{
                        carId:currentClickPoint.id,
                    }
                })
            },
            queryNearbyCar(){
                dispatch({
                    type:'realTime/getNearByCar',
                    payload:{
                        carId:currentClickPoint.id,
                        calPointsDistance(p1,p2){
                            return t.map.calculatePointsDistance(p1,p2);
                        }
                    }
                });
            },
            showStatisticChart(){
                t.updateModel({showStatistics:true})
            },
            update:t.updateModel,
            batchUpdatePointAddress(carIds){
                dispatch({
                    type:'realTime/batchUpdatePointAddress',
                    payload:{
                        carIds
                    }
                })
            }
        }

        // 工具栏
        const toolBoxProps = {
            data:{
                toolboxCfg:t.genToolBoxCfg(),
            },
            menuSelect(menuIndex,optIndex){
                t.toolBoxSelect(menuIndex,optIndex);
            }
        }

        // 图例
        const iconList = Object.keys(carIcons).filter((carType)=>carIcons[carType].carTreeOnline).map((carType)=>{
            return {
                name:carIcons[carType].name,
                iconUrl:carIcons[carType].carTreeOnline
            }
        })
        const legendBoxProps = {
            iconList,
            closeLegendBox(){
                t.updateModel({
                    showLegend:false
                })
            }
        }

        // 车辆统计图表
        const carStatisticsProps = {
            ...carStatistics,
            closeCarStatisticsChart(){
                t.updateModel({showStatistics:false})
            }
        }

        // 多车跟踪树
        const TreeProps = {
            data: leftPanelCfg.treeData,
            defaultExpandAll:true,
            checkable:true,
            checkedKeys:batchTrackWindow.checkedKeys,
            onCheck({key,isChecked,checkedKeys, treeNode, leafNode }){
                t.updateModel({
                    batchTrackWindow:{
                        checkedKeys
                    }
                })
            },
            
        };
        return (
            <div className={`${style.rm} ${videoCfg.showVideo?style.withVideo:''} ${bkCfg.isNarrow?style.narrowLeft:''}`}>
                {
                    pageStatus!='normal'?<div className={style.trackTip}>当前正处于车辆跟踪状态</div>
                    :null
                }
                {
                    mapCfg.mapType?<VtxOptMap {...mapProps} getMapInstance={(map)=>{if(map)t.map=map}} />:null
                }
                
                <SearchInput {...searchInputProps}/>
                <LeftPanel {...leftPanelProps} ref={(ins)=>{if(ins)t.leftPanelInstance = ins}}/>
                <BottomPanel {...bottomPanelProps} ref={(ins)=>{if(ins)t.bottomPanelInstance = ins}}/>
                <ToolBox {...toolBoxProps}/>

                <div className={style.msgArea}>
                    {
                        showLegend?<LegendBox key='legend' {...legendBoxProps}/>:null
                    }
                    {
                        showStatistics?<CarStatistics key='statistic' {...carStatisticsProps}/>:null
                    }
                </div>
   
                {
                    videoCfg.showVideo?<div className={style.videoct}>
                        {
                            videoCfg.videoAddress.map(ads=>ads?<iframe style={{height:`${100/videoCfg.videoAddress.length}%`}} src={ads}></iframe>:<div className={style.noVideo} style={{height:`${100/videoCfg.videoAddress.length}%`}}><div>暂无视频</div></div>)
                        }
                    </div>:null
                }

                <VtxModal key="iconWindow"
                    title='添加标记点'
                    visible={markWindow.show}
                    width={300}
                    onOk={()=>{
                        t.updateModel({
                            markWindow:{
                                show:false,
                                pointInfo:{config:{labelContent:''}}
                            },
                            mapCfg:{
                                isCloseDraw:true
                            }
                        });
                        setTimeout(()=>{
                            t.updateModel({
                                mapCfg:{
                                    isCloseDraw:false
                                }
                            })
                        },50);
                        t.map.updatePoint([markWindow.pointInfo])
                    }}
                    onCancel={()=>{
                        t.updateModel({
                            markWindow:{
                                show:false,
                                pointInfo:{config:{labelContent:''}}
                            },
                            mapCfg:{
                                isCloseDraw:true
                            }
                        })
                        setTimeout(()=>{
                            t.updateModel({
                                mapCfg:{
                                    isCloseDraw:false
                                }
                            })
                        },50)
                    }}
                >
                    <Input value={markWindow.pointInfo.config.labelContent} onChange={(e)=>{
                        t.updateModel({
                            markWindow:{
                                pointInfo:{config:{labelContent:e.target.value}}
                            }
                        })
                    }}/>
                </VtxModal>

                <VtxModal key="refreshWindow"
                    title={`设置页面自动刷新频率`}
                    visible={refreshWindow.show}
                    width={220}
                    onOk={()=>{
                        t.setRefreshTimer(parseInt(refreshWindow.value))
                        t.updateModel({
                            refreshWindow:{
                                show:false
                            }
                        })
                        message.success('设置成功');

                    }}
                    onCancel={()=>{
                        t.updateModel({
                            refreshWindow:{
                                show:false
                            }
                        })
                    }}
                >
                    <div style={{marginBottom:'10px'}}>
                        {`当前刷新频率：${refreshWindow.refreshOptions.filter((item)=>item.val==refreshInterval).pop().name}`}
                    </div>  
                    <Select style={{width:'100px'}} value={refreshWindow.value} onChange={(val)=>{
                        t.updateModel({
                            refreshWindow:{
                                value:val
                            }
                        })
                    }}>
                        {
                            refreshWindow.refreshOptions.map((item)=><Option key={item.val}>{item.name}</Option>)
                        }
                    </Select>
                </VtxModal> 

                <VtxModal key="batchTrackWindow"
                    title='批量跟踪'
                    visible={batchTrackWindow.show}
                    width={500}
                    onOk={()=>{
                        t.addTrack(batchTrackWindow.checkedKeys.filter((id)=>carsInfo[id]))
                        t.startTrack('track-m');
                        t.updateModel({
                            batchTrackWindow:{
                                show:false,
                                checkedKeys:[]
                            }
                        })
                    }}
                    onCancel={()=>{
                        t.updateModel({
                            batchTrackWindow:{
                                show:false,
                                checkedKeys:[]
                            }
                        })
                    }}
                >
                    <div>
                        <VtxZtree {...TreeProps}/>
                    </div>
                </VtxModal>

                <VtxModal key="sendMessage"
                    title='调度信息'
                    visible={sendMsgWindow.show}
                    width={400}
                    onCancel={()=>{
                        t.updateModel({
                            sendMsgWindow:{
                                show:false
                            }
                        });
                        t.clearMsgInfo();
                    }}
                    footer={[
                        <Button key="send" type="primary" loading={sendMsgWindow.loading} onClick={()=>{
                            dispatch({
                                type:'realTime/sendSchedulingMsg'
                            })
                        }}>发送</Button>,
                        <Button key="clear" onClick={()=>{
                            t.clearMsgInfo();
                        }}>清空</Button>
                    ]}
                >
                    <div style={{lineHeight:'26px'}}>
                        <div>车牌号：{(carsInfo[sendMsgWindow.carId]||{}).carCode}</div>
                        {
                            bkCfg.dispatchType=='sms'?<div>
                                <div>
                                    调度模板：{
                                        bkCfg.smsTemplate.split('%s').map((txt,index)=>{
                                            if(index){
                                                return `【文本${index}】${txt}`
                                            }
                                            else{
                                                return txt;
                                            }
                                        })
                                    }
                                </div>
                                {
                                    bkCfg.smsTemplate.match(/%s/g).map((item,index)=>{
                                        return (
                                            <div key={`msg-txt-${index}`}>文本{index+1}：
                                            <Input type="textarea" value={sendMsgWindow.templateMsg[index]} onChange={(e)=>{
                                                t.updateModel({
                                                    sendMsgWindow:{
                                                        templateMsg:{[index]:e.target.value}
                                                    }
                                                })
                                            }}/>
                                            </div>
                                        )
                                    })
                                }
                                
                            </div>:
                            <div>调度信息：
                                <Input type="textarea" value={sendMsgWindow.msg} onChange={(e)=>{
                                    t.updateModel({
                                        sendMsgWindow:{
                                            msg:e.target.value
                                        }
                                    })
                                }}/>
                            </div>
                        }       
                    </div>
                </VtxModal>
            </div>
        )
    }
}

export default connect(({realTime})=>realTime)(RealTime);