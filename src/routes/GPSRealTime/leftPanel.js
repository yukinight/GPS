import React from 'react';
import style from './leftPanel.less';
import st2 from './index.less';
import {Icon, Tree, Button, Dropdown, Menu} from 'antd';
import {VtxZtree} from 'vtx-ui';
import ReactEcharts from 'echarts-for-react';
import RenderInBody from '../../components/renderInBody';
import {deepEqual,VtxUtil} from '../../utils/util';
import {getNewCarNameTree} from '../../utils/GPSUtil';

class LeftPanel extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            collapse:false,//控制面板打开关闭
            detailPnState:0,//0收起，1一半，2撑满
            rightClickMenu:{
                show:false,
                left:0,
                top:0,
                carId:null
            }
        }  
    }
    componentDidMount(){
        document.addEventListener('click',this.clickHandler.bind(this));
    }
    componentWillUnmount(){
        document.removeEventListener('click',this.clickHandler.bind(this));
    }
    // 全局点击事件管理：用于隐藏右键菜单，下拉菜单
    clickHandler(e){
        this.hideRightMenu();
        // console.log(e,e.target,this.state.collapse);
    }
    hideRightMenu(){
        this.setState({
            rightClickMenu:{
                show:false,
                left:0,
                top:0,
                carId:null
            }
        })
    }
    detailPnToggle(way){
        const currenState = this.state.detailPnState;
        switch(way){
            case 'up':
                if(currenState!=2){
                    this.setState({
                        detailPnState: currenState + 1
                    })
                }
                break;
            case 'down':
                if(currenState!=0){
                    this.setState({
                        detailPnState: currenState - 1
                    })
                }
                break;
            case 'open':
                if(currenState==0){
                    this.setState({
                        detailPnState: 1
                    })
                }
                break;
        }
    }
    getShowTreeData(){
        const {treeData,treeConfig} = this.props.data;
        const nodeInfoMenu = treeConfig.filter((item)=>item.id=='treeNodeInfo').pop();
        const shouldShowKeys = nodeInfoMenu?nodeInfoMenu.children.map(item=>{if(item.selected)return item.name}).filter(v=>v):[];
        return getNewCarNameTree(treeData,shouldShowKeys);
    }
    jumpToHistory(carId){
        const carCode = this.props.data.carsInfo[carId].carCode;
        window.open(`/#/history/?carId=${carId}&carCode=${carCode}&tenantId=${VtxUtil.getUrlParam('tenantId')}&userId=${VtxUtil.getUrlParam('userId')}`)
    }
    render(){
        const t = this;

        const {treeData,currentClickPoint,treeConfig,selectedNodes,carsInfo,
            treeExpandedKeys,pageStatus,trackCfg,gasStation,bkCfg,videoCfg} = t.props.data;
        const {updateLeftPanelCfg,treeCfgSelect,update,pickOneCar,selectCars,
            trackOneCar,stopTrack,carIsTracking,openMsgWindow,getVideo,closeVideo} = t.props;
        let treePnStyle = {};
        let detailPnStyle = {};
        // 面板高度切换
        switch(t.state.detailPnState){
            case 0:
                treePnStyle.height = 'calc(100% - 35px)';
                treePnStyle.display = 'block';
                detailPnStyle.height = '35px';
                break;
            case 1:
                treePnStyle.height = '50%';
                treePnStyle.display = 'block';
                detailPnStyle.height = '50%';
                break;
            case 2:
                treePnStyle.height = '0';
                treePnStyle.display = 'none';
                detailPnStyle.height = '100%';
        }


        // 车辆树头部
        const TreeHeadProps = {
            data:{
                treeConfig
            },
            treeCfgSelect
        }
        // 车辆树传参
        const TreeProps = {
            data:{
                data: t.getShowTreeData(),
                isExpandAll:'other',
                autoExpandParent:false,
                expandedKeys:treeExpandedKeys,
                checkable:true,
                checkedKeys:selectedNodes,
            },
            func:{
                onCheck({key,isChecked,checkedKeys, treeNode, leafNode }){
                    selectCars(checkedKeys);
                },
                onExpand({key, isExpand, treeNode, expandedKeys }){                
                    update({
                        leftPanelCfg:{
                            treeExpandedKeys:expandedKeys
                        }
                    })
                },
                onClick({key,treeNode, selectedKeys }){
                    if(treeNode.isLeaf){
                        // 详情页面打开一半
                        t.setState({
                            detailPnState:1
                        });
                        pickOneCar(treeNode.attributes.id);
                    }
                    
                },
                onRightClick({event, key,treeNode }){
                    if(treeNode.isLeaf){
                        t.setState({
                            rightClickMenu:{
                                carId:treeNode.key,
                                show: true,
                                left:event.pageX,
                                top:event.pageY
                            }
                        })
                    }
                },
            }
        };

        // 详情面板传参
        const DetailPnProps = {
            data:{
                pointType:currentClickPoint.pType,
                gasStationInfo: gasStation.points.filter((item)=>item.id==currentClickPoint.id).pop()||{},
                carInfo: carsInfo[currentClickPoint.id]||{},
                videoCfg,
                // 两个后台配置开关
                ifShowOil:bkCfg.isOil,
                ifShowRpm:bkCfg.showRpm,
                // 下面两个参数是用来判断组件是否要刷新
                pageStatus,
                trackPointsId:trackCfg.trackPointsId
            },
            trackOneCar,
            stopTrack,
            carIsTracking,
            openMsgWindow,
            getVideo,
            closeVideo,
            jumpToHistory:t.jumpToHistory.bind(t)
        }
        
        const RightClickMenu = <ul className={style.carTreeMenu}>
            {
                carIsTracking(t.state.rightClickMenu.carId)?<li style={{fontWeight:'bold'}} onClick={(e)=>{
                    stopTrack();
                    t.hideRightMenu();
                }}>停止跟踪</li>
                :
                <li onClick={(e)=>{
                    trackOneCar(t.state.rightClickMenu.carId);
                    t.hideRightMenu();
                }}>跟踪车辆</li>
            }
            <li onClick={()=>{
                t.jumpToHistory(t.state.rightClickMenu.carId);
            }}>历史轨迹</li>
            {
                videoCfg.showVideo && videoCfg.carId==t.state.rightClickMenu.carId?<li style={{fontWeight:'bold'}} onClick={closeVideo}>关闭视频</li>:<li onClick={()=>{
                    getVideo(t.state.rightClickMenu.carId);
                }}>查看视频</li>
            }
            <li onClick={()=>{
                openMsgWindow(t.state.rightClickMenu.carId);
            }}>调度信息发送</li>
        </ul>;

        return (
            <div className={`${t.state.collapse?style.ct_collapse:style.ct} ${st2.treeArea}`}>
                {/* 右键菜单 */}
                {
                    t.state.rightClickMenu.show?<RenderInBody {...t.state.rightClickMenu}>
                        {RightClickMenu}
                    </RenderInBody>:null
                }
                {/* 左边栏 */}
                {
                    t.state.collapse?<div className={style.bar} onClick={()=>{
                        t.setState({
                            collapse:false
                        })
                    }}>展开 <Icon type="down" className={style.bar_icon}/></div>
                    :
                    [
                        <div key='1' className={style.mpanel}>
                            <div className={style.treePn} style={treePnStyle}>
                                <TreeHead {...TreeHeadProps}/>
                                <div className={style.treeBody}>
                                    <ImmutableTree {...TreeProps}/>
                                </div>
                                
                            </div>
                            <div className={style.detailPn} style={detailPnStyle}>
                                <div className={style.detailHead}>
                                    <span>
                                        {
                                            (()=>{
                                                switch(currentClickPoint.pType){
                                                    case 'gasStation':
                                                        return '加油站信息'
                                                    default:
                                                        return  '车辆信息'               
                                                }
                                            })()
                                        }
                                    </span>
                                    <Icon type="up" className={style.toggle_icon+' '+style.up} onClick={()=>t.detailPnToggle('up')}/>
                                    <Icon type="down" className={style.toggle_icon+' '+style.down} onClick={()=>t.detailPnToggle('down')}/>
                                </div>
                                
                                <DetailPn {...DetailPnProps}/>
                            </div>
                        </div>,
                        <div key='2' className={style.bar} onClick={()=>{
                            t.setState({
                                collapse:true
                            })
                        }}>收起 <Icon type="up" className={style.bar_icon}/></div>
                    ]
                }
                
                
            </div>
        )
    }
}

// 树的头部配置
class TreeHead extends React.Component{
    constructor(props){
        super()
    }
    shouldComponentUpdate(nextProps, nextState){
        if(deepEqual(this.props.data,nextProps.data)){
            return false;
        }
        else{
            return true;
        }
    }
    render(){
        const {treeConfig} = this.props.data;
        const {treeCfgSelect} = this.props;
        return (
            <div className={style.treeHead}>
                {
                    treeConfig.map((item,index)=>(<div key={item.name} style={{width:`${parseInt(100/treeConfig.length)}%`}} className={style.treeHeadNode}>
                        <Dropdown overlay={genMenu({menuIndex:index,menuOptions:item.children,optionSelect:treeCfgSelect})} placement="bottomCenter">
                            <Button>
                                {item.name}
                                <Icon type="down"/>
                            </Button>
                        </Dropdown>
                    </div>))
                }
            </div>
        )
    }
}

class ImmutableTree extends React.Component{
    constructor(props){
        super();
    }
    shouldComponentUpdate(nextProps, nextState){
        if(deepEqual(this.props.data,nextProps.data)){
            return false;
        }
        else{
            return true;
        }
    }
    render(){
        const TreeProps = {
            ...this.props.data,...this.props.func
        }
        return (<VtxZtree {...TreeProps}/>)
    }
}


// 树的头部配置-->菜单选项
function genMenu({menuIndex,menuOptions,optionSelect}){
    return (<Menu onClick={({key})=>{
        optionSelect(menuIndex,key);
    }}>
        {
            menuOptions.map((item,index)=>(
                <Menu.Item key={index}>
                    <div className={item.selected?style.selectedNode:style.menuNode}>
                        {item.name}
                    </div>
                </Menu.Item>
            ))
        }
    </Menu>)
}

// 详情面板
class DetailPn extends React.Component{
    constructor(props){
        super()
    }
    shouldComponentUpdate(nextProps, nextState){
        if(deepEqual(this.props.data,nextProps.data)){
            return false;
        }
        else{
            return true;
        }
    }
    render(){
       
        // 数据
        const {carInfo,pageStatus,pointType,gasStationInfo,ifShowOil,ifShowRpm,
            videoCfg} = this.props.data;
        // 函数
        const {trackOneCar,stopTrack,carIsTracking,openMsgWindow,getVideo,closeVideo,
            jumpToHistory} = this.props;
        // 车辆信息
        const {driver,driverPhone,carCode,carClassesName,companyName,analog0,
            speed,oilMass,equipmentTime,carStatus,currentAddress} = carInfo;
        // 加油站或车辆列表信息
        let detailList = pointType=='gasStation'?[
            {title:'编号',value:gasStationInfo.attr.code},
            {title:'名称',value:gasStationInfo.attr.name},
            {title:'地址',value:gasStationInfo.attr.address},
        ]:[
            {title:'驾驶员',value:driver},
            {title:'联系方式',value:driverPhone},
            {title:'车牌号',value:carCode},
            {title:'车辆类型',value:carClassesName},
            {title:'所属单位',value:companyName},
            {title:'当前速度',value:speed===undefined?'':`${speed} km/h`},
            {title:'当前油量',value:oilMass===undefined?'':`${oilMass} L`},
            {title:'当前转速',value:`${analog0} rpm`},
            {title:'上报时间',value:equipmentTime},
            {title:'GPS状态',value:carStatus},
            {title:'当前位置',value:currentAddress},
        ];
        // 不显示油耗的处理
        if(!ifShowOil){
            detailList = detailList.filter(item=>item.title!='当前油量')
        }
        if(!ifShowRpm){
            detailList = detailList.filter(item=>item.title!='当前转速')
        }

        let gaugeSeries = [
            {
                name: '速度',
                type: 'gauge',
                tooltip : {
                    formatter: "{a} <br/>{c} km/h"
                },
                detail : {
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        fontWeight: 'normal',
                        fontSize:16,
                    },
                    offsetCenter:['0%', '-20%'],
                    formatter:(value)=>`${value}km/h`
                },
                z: 3,
                min: 0,
                max: 120,
                splitNumber: 12,
                radius: '85%',
                axisLine: {            // 坐标轴线
                    lineStyle: {       // 属性lineStyle控制线条样式
                        width: 10
                    }
                },
                axisTick: {            // 坐标轴小标记
                    length: 15,        // 属性length控制线长
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: 'auto'
                    }
                },
                splitLine: {           // 分隔线
                    length: 20,         // 属性length控制线长
                    lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                        color: 'auto'
                    }
                },
                title : {
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        fontWeight: 'normal',
                        fontSize: 12
                    }
                },            
                data:[{
                    value: speed||0,name:'速度'
                }]
            },
            {
                name: '油表',
                type: 'gauge',
                tooltip : {
                    formatter: "{a} <br/>{c} L"
                },
                detail : {
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        fontWeight: 'normal',
                        fontSize:16,
                    },
                    offsetCenter:['0%', '50%'],
                    formatter:(value)=>`${value}L`
                },
                center: ['50%', '57%'],    // 默认全局居中
                radius: '65%',
                min: 0,
                max: 220,
                startAngle: -45,
                endAngle: -135,
                splitNumber: 2,
                axisLine: {            // 坐标轴线
                    lineStyle: {       // 属性lineStyle控制线条样式
                        width: 8
                    }
                },
                axisTick: {            // 坐标轴小标记
                    splitNumber: 5,
                    length: 10,        // 属性length控制线长
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: 'auto'
                    }
                },
                axisLabel: {
                    formatter:function(v){
                        switch (v + '') {
                            case '0' : return 'E';
                            case '110' : return '油量';
                            case '220' : return 'F';
                        }
                    }
                },
                splitLine: {           // 分隔线
                    length: 15,        // 属性length控制线长
                    lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                        color: 'auto'
                    }
                },
                pointer: {
                    width:1
                },
                title : {
                    show: false
                },            
                data:[{
                    value:oilMass||0
                }]
            },
        ]

        // 如果配置项不显示油量或车辆油耗类型为消耗量，油表盘不显示
        if(!ifShowOil || carInfo.oilMeasureType=='消耗量'){
            gaugeSeries.pop();
        }

        const speedPanelOption = {
            tooltip : {
                trigger:'item'
            },
            series : gaugeSeries
        };

        
        return (
            <div className={style.detailBody}>
                <ul>
                    {
                        detailList.map((item,index)=><li key={index}>
                            <div className={style.titleLabel}>{item.title}</div>
                            {item.value}
                        </li>)
                    }
                </ul>
                {
                    pointType=='car'?<div>
                        <ReactEcharts
                            option={speedPanelOption} 
                            style={{height:'240px'}}
                            notMerge={true}
                            lazyUpdate={true}
                        />
                        {
                            carInfo.carId?<div className={style.buttonCt}>
                                {
                                    carIsTracking(carInfo.carId)?<Button type="danger" onClick={()=>{
                                        stopTrack();
                                    }}>停止跟踪</Button>
                                    :
                                    <Button type="primary" onClick={()=>{
                                        trackOneCar(carInfo.carId);
                                    }}>跟踪车辆</Button>   
                                }
                                <Button type="primary" onClick={()=>{
                                    jumpToHistory(carInfo.carId)
                                }}>历史轨迹</Button>
                                {
                                    videoCfg.showVideo && videoCfg.carId==carInfo.carId?<Button type="danger" onClick={()=>{
                                        closeVideo();
                                    }}>关闭视频</Button>:<Button type="primary" onClick={()=>{
                                        getVideo(carInfo.carId);
                                    }}>查看视频</Button>
                                }
                                
                                <Button type="primary" onClick={()=>{
                                    openMsgWindow(carInfo.carId);
                                }}>调度信息发送</Button>
                            </div>
                            :null
                        }
                    </div>
                    :null
                }
                
                
            </div>
        )
    }
}

export default LeftPanel;