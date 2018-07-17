import React from 'react';
import {connect} from 'dva';
import {VtxMap,VtxModal,VtxTree,VtxModalList,VtxDate} from 'vtx-ui';
import {Spin} from 'antd';
import SearchInput from '../GPSRealTime/searchInput';
import ToolBox from '../GPSRealTime/toolBox';
import LeftPanel from './leftPanel';
import BottomPanel from './bottomPanel';
import TrackMap from './trackMap';
import CarPlayControl from './carPlayControl';
import style from './index.less';

import moment from 'moment';
import {VtxTime,strToColor} from '../../utils/util';
import {mergeMapElems} from '../../utils/GPSUtil'
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
        dispatch({
            type:'history/getGPSConfig'
        });
        // 设置地图中心点
        dispatch({
            type:'history/getCenterLocation'
        });
        // 获取车辆树
        dispatch({
            type:'history/getCarTree',
            payload:{initial:true}
        });
        // 获取关注区列表
        dispatch({type:'history/getFocusAreaList'});
    }
    // 车辆历史数据,树查询
    search(){
        const {dispatch,pageStatus} = this.props;
        dispatch({type:'history/getCarTree'});
        // if(pageStatus=='normal'){
        //     dispatch({type:'realTime/getCarPoints'});
        // }
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
        optionId = t.props.toolboxCfg[menuIndex].children[optIndex].id
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
    genMapPointsForStopCar(){
        return this.props.carStopInfo.map((item,index)=>{
            return {
                id:`stopcar-${index}`,    
                latitude:item.latitudeDone,
                longitude:item.longitudeDone,
                canShowLabel:true,
                url: GPS_ICON.map.carStop,
                pointType:'stopCar',
                config:{
                    width:30,
                    height:30,
                    markerContentX:-15,
                    markerContentY:-15,
                    labelContent:item.name
                }
            }
        })
    }
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
                }
            }
        })
    }
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
                }
            }
        })
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
            carPositionsLine,showHistoryPath,showStopCar,carStopInfo,
            selectedCarPositionIndex,selectedArea,loading,selectedRefuelingId,
            selectedAbnormalId,selectedGasStationId,refuelingPoints,abnormalPoints} = this.props;

        // 地图配置变动
        let newMapCfg = {
            ...mapCfg,
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
        
        // 关注区增加图元
        const focusAreaMapElems = t.focusAreaDataProcessor();
        newMapCfg = mergeMapElems(newMapCfg,focusAreaMapElems);
        
        newMapCfg = mergeMapElems(newMapCfg,{
            mapPoints:[
                ...t.genMapPointsForRefuelingPoints(),
                ...t.genMapPointsForAbnormalPoints()
            ]
        });
        // 是否显示加油站
        if(t.getToolBarStateById('gasStation','selected')){
            newMapCfg = mergeMapElems(newMapCfg,{
                mapPoints:gasStation.points
            });
        }
        // 是否显示维修厂
        if(t.getToolBarStateById('repairShop','selected')){
            newMapCfg = mergeMapElems(newMapCfg,{
                mapPoints:repairShop.points
            });
        }
        // 是否显示历史轨迹线
        if(showHistoryPath && carPositionsLine.id){
            newMapCfg = mergeMapElems(newMapCfg,{
                mapLines:[carPositionsLine]
            });
        }
        // 是否显示停车点位
        if(showStopCar){
            newMapCfg = mergeMapElems(newMapCfg,{
                mapPoints:t.genMapPointsForStopCar()
            });
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
            fetchAddressForCarPositions(startIndex,endIndex){
                dispatch({
                    type:'history/getAddressForCarPositions',
                    payload:{
                        startIndex,endIndex
                    }
                });
            },
            clickStopCar(){
            },
            clickCarPath(index){
                // 轨迹播放时忽略点击事件
                if(!carPlayCfg.isPlaying){
                    t.leftPanelInstance.detailPnToggle('open');
                    t.leftPanelInstance.switchDetailPn('carPosition');
                    t.updateModel({
                        selectedCarPositionIndex:index,
                    })
                }
            },
            moveMapTo({zoom,center}){
                dispatch({
                    type:'history/setMapZoomCenter',
                    payload:{
                        zoom,center
                    }
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
                <SearchInput {...searchInputProps}/>
                <TrackMap {...mapProps} ref={(inst)=>{if(inst)t.map=inst}}/>
                
                <LeftPanel {...leftPanelProps} ref={(ins)=>{if(ins)t.leftPanelInstance = ins}}/>
                <BottomPanel {...bottomPanelProps} ref={(ins)=>{if(ins)t.bottomPanelInstance = ins;}}/>
                <ToolBox {...toolBoxProps}/>
              
                <CarPlayControl {...carPlayProps}/>

                <VtxModal key="selectArea"
                    title='框选区域车辆'
                    visible={selectedArea.show}
                    width={500}
                    onOk={()=>{
                        dispatch({
                            type:'history/getCarTreeBySelectedArea'
                        }); 
                        t.updateModel({
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
                
            </div>
            
        )
    }
}

export default connect(({history})=>history)(GPSHistory);