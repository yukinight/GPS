import React from 'react';
import style from './leftPanel.less';
import st2 from './index.less';
import {Icon, Button, Dropdown, Menu,Select,Tag,Tabs,message} from 'antd';
import {VtxZtree,VtxModalList,VtxDate} from 'vtx-ui';
import ReactEcharts from 'echarts-for-react';
import {deepEqual} from '../../utils/util';
import {getNewCarNameTree} from '../../utils/GPSUtil';
import moment from 'moment';

const {VtxDatePicker} = VtxDate;
const TabPane = Tabs.TabPane;
const {Option} = Select;

class LeftPanel extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            collapse:false,//控制面板打开关闭
            detailPnState:0,//0收起，1一半，2撑满
            currentDetailPn:'',//当前切换的详情面板id,共有4个:carPosition,gasStation,carRefueling,carAbnormal,
            detailPnList:[],
        }  
    }
    detailPnToggle(way){
        const currenState = this.state.detailPnState;
        switch(way){
            case 'up':
                if(currenState!=2){
                    this.setState({
                        detailPnState: 2
                    })
                }
                break;
            case 'down':
                if(currenState!=0){
                    this.setState({
                        detailPnState: 0
                    })
                }
                break;
            case 'open':
                if(currenState==0){
                    this.setState({
                        detailPnState: 2
                    })
                }
                break;
        }
    }
    switchDetailPn(pnType){
        if(pnType!=this.state.currentDetailPn){
            if(this.state.detailPnList.indexOf(pnType)>=0){
                this.setState({
                    currentDetailPn:pnType,
                })
            }
            else{
                this.setState({
                    currentDetailPn:pnType,
                    detailPnList:[...this.state.detailPnList,pnType]
                })
            }
        }
    }
    closeDetailPn(pnType){
        if(pnType==this.state.currentDetailPn){
            this.setState({
                currentDetailPn:this.state.detailPnList[0],
                detailPnList:this.state.detailPnList.filter((item)=>{
                    return item!=pnType;
                })
            })
        }
        else{
            this.setState({
                detailPnList:this.state.detailPnList.filter((item)=>{
                    return item!=pnType;
                })
            })
        }
        
    }
    getShowTreeData(){
        const {treeData,treeConfig} = this.props.data;
        const nodeInfoMenu = treeConfig.filter((item)=>item.id=='treeNodeInfo').pop();
        const shouldShowKeys = nodeInfoMenu?nodeInfoMenu.children.map(item=>{if(item.selected)return item.name}).filter(v=>v):[];
        return getNewCarNameTree(treeData,shouldShowKeys);
    }
    render(){
        const t = this;

        const {treeData,treeConfig,treeExpandedKeys,bkCfg,trackQueryForm,carPositions,
            selectedCarPositionIndex,selectedRefuelingInfo,selectedAbnormalInfo,
            selectedGasStation} = t.props.data;

        const {update,treeCfgSelect,selectCar,searchCarPath} = t.props;
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
            },
            func:{
                onExpand({key, isExpand, treeNode, expandedKeys }){        
                    update({
                        leftPanelCfg:{
                            treeExpandedKeys:expandedKeys
                        }
                    })
                },
                onClick({key,treeNode, selectedKeys }){
                    if(treeNode.isLeaf){
                        selectCar({
                            carId: treeNode.key,
                            carCode: treeNode.attributes.carCode
                        })
                    }
                    
                },
            }
        };

        // 详情面板传参
        const DetailPnProps = {
            data:{
                carPositions,
                selectedCarPositionIndex        
            },
        }
        
        const TT = <div>
            <Icon type="up" className={style.toggle_icon+' '+style.up} onClick={()=>t.detailPnToggle('up')}/>
            <Icon type="down" className={style.toggle_icon+' '+style.down} onClick={()=>t.detailPnToggle('down')}/>
        </div>

        return (
            <div className={`${t.state.collapse?style.ct_collapse:style.ct} ${st2.treeArea}`}>
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
                                <div className={style.queryForm}>
                                    <VtxModalList 
                                    visible={true}>
                                        <div data-modallist={{layout:{
                                            name:'选中车辆',
                                            width:90,
                                            type:'text'
                                        }}} style={{paddingBottom:'18px'}}>
                                            {
                                                trackQueryForm.selectedCarInfo.carCode?<Tag color="#2db7f5">{trackQueryForm.selectedCarInfo.carCode}</Tag>
                                                :''
                                            }
                                        </div>

                                        <Select value={trackQueryForm.selectPeriod} onChange={(val)=>{
                                            let startTime,endTime;
                                            switch(val){
                                                case 'today':
                                                    startTime = moment().startOf('day');
                                                    endTime = moment().endOf('day');
                                                    break;
                                                case 'yestoday':
                                                    startTime = moment().subtract(1, 'days').startOf('day');
                                                    endTime = moment().subtract(1, 'days').endOf('day');
                                                    break;
                                                case 'dayBeforeYestoday':
                                                    startTime = moment().subtract(2, 'days').startOf('day');
                                                    endTime = moment().subtract(2, 'days').endOf('day');
                                                    break;
                                                case 'last24hours':
                                                    startTime = moment().subtract(1, 'days');
                                                    endTime = moment();
                                                    break;
                                            }
                                            update({
                                                trackQueryForm:{
                                                    selectPeriod:val,
                                                    startTime,
                                                    endTime
                                                }
                                            });
                                            searchCarPath();
                                        }} data-modallist={{layout:{
                                            name:'选择时段',
                                            width:90
                                        }}}>
                                            {trackQueryForm.periodOptions.map(item=><Option key={item.id}>{item.name}</Option>)}
                                        </Select>
                                        <VtxDatePicker value={trackQueryForm.startTime} onChange={(val)=>{
                                            if(trackQueryForm.endTime && !val.isBefore(trackQueryForm.endTime)){
                                                message.warn('开始时间不能大于结束时间')
                                                return;
                                            }
                                            update({
                                                trackQueryForm:{
                                                    startTime:val
                                                }
                                            });
                                        }} showTime={true} data-modallist={{layout:{
                                            name:'开始时间',
                                            width:90
                                        }}}/>
                                        <VtxDatePicker value={trackQueryForm.endTime} onChange={(val)=>{
                                            if(trackQueryForm.endTime && !val.isAfter(trackQueryForm.startTime)){
                                                message.warn('结束时间不能小于开始时间')
                                                return;
                                            }
                                            update({
                                                trackQueryForm:{
                                                    endTime:val
                                                }
                                            });
                                        }} showTime={true} data-modallist={{layout:{
                                            name:'结束时间',
                                            width:90
                                        }}}/>
                                    </VtxModalList>
                                    <div style={{textAlign:'center'}}>
                                        <Button type='primary' onClick={searchCarPath}>查询轨迹</Button>
                                    </div>
                                   
                                </div>
                            </div>
                            <div className={this.state.detailPnState==0?`${style.detailPn} ${style.hiddenTabs}`:style.detailPn} style={detailPnStyle} >
                                <Tabs activeKey={this.state.currentDetailPn} 
                                type={'editable-card'} 
                                hideAdd={true}
                                tabBarExtraContent={TT}
                                onChange={(tabKey)=>{
                                    this.setState({
                                        currentDetailPn:tabKey
                                    })
                                }}
                                onEdit={(tabKey)=>{
                                    this.closeDetailPn(tabKey);
                                }}>
                                    {
                                        this.state.detailPnList.map((pnKey)=>{
                                            switch(pnKey){
                                                case 'carPosition':
                                                    return (
                                                        <TabPane tab="车辆信息" key="carPosition" closable={false}>
                                                            <CarDetailPn {...DetailPnProps}/>
                                                        </TabPane>
                                                    );
                                                case 'gasStation':
                                                    return (
                                                        <TabPane tab="加油站信息" key="gasStation" closable={true}>
                                                            <GasStationPn {...selectedGasStation.attr}/>
                                                        </TabPane>
                                                    );
                                                case 'carRefueling':
                                                    return (
                                                        <TabPane tab="加油信息" key="carRefueling" closable={true}>
                                                            <RefuelingPn {...selectedRefuelingInfo}/>
                                                        </TabPane>
                                                    );
                                                case 'carAbnormal':
                                                    return (
                                                        <TabPane tab="异常信息" key="carAbnormal" closable={true}>
                                                            <AbnormalPn {...selectedAbnormalInfo}/>
                                                        </TabPane>
                                                    );
                                                default:
                                                    return null;
                                            }
                                            // return (
                                            //     <TabPane tab="车辆信息" key="carPosition" closable={false}>
                                            //         <CarDetailPn {...DetailPnProps}/>
                                            //     </TabPane>
                                            // )
                                        })
                                    }
                                </Tabs>
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
                    treeConfig.map((item,index)=>(<div key={item.name} className={style.treeHeadNode}>
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

// 车辆详情面板
class CarDetailPn extends React.Component{
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
        const {carPositions,selectedCarPositionIndex} = this.props.data;
        const carInfo = selectedCarPositionIndex!==null?carPositions[selectedCarPositionIndex]:{};
        let detailList = [
            {title:'驾驶员',value:carInfo.driver},
            {title:'联系方式',value:carInfo.driverPhone},
            {title:'车牌号',value:carInfo.carCode},
            {title:'车辆类型',value:carInfo.carClassesName},
            {title:'所属单位',value:carInfo.companyName},
            {title:'当前速度',value:carInfo.speed===undefined?'':`${carInfo.speed} km/h`},
            {title:'上报时间',value:carInfo.equipmentTime},
            {title:'GPS状态',value:carInfo.carStatus},
            {title:'当前位置',value:carInfo.address},
        ];

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
                    value: carInfo.speed||0,name:'速度'
                }]
            },
        ]

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
                <ReactEcharts
                    option={speedPanelOption} 
                    style={{height:'240px',width:'300px'}}
                    notMerge={true}
                    lazyUpdate={true}
                />
            </div>
        )
    }
}

function GasStationPn(props){
    let detailList = [
        {title:'编号',value:props.code},
        {title:'名称',value:props.name},
        {title:'地址',value:props.address},
    ];
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
        </div>
    );
}

function RefuelingPn(props){
    let detailList = [
        {title:'车牌号',value:props.carCode||''},
        {title:'加油时间',value:props.addOilDateTime||''},
        {title:'加油前油量',value:typeof props.beforeOilMass=='number'?`${props.beforeOilMass}L`:''},
        {title:'加油后油量',value:typeof props.afterOilMass=='number'?`${props.afterOilMass}L`:''},
        {title:'加油量',value:typeof props.addOilMass=='number'?`${props.addOilMass}L`:''},
        {title:'加油地址',value:props.addOilAddress||''},
    ];
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
        </div>
    )
}

function AbnormalPn(props){
    let detailList = [
        {title:'车牌号',value:props.carCode||''},
        {title:'异常时间',value:props.exceptionTime||''},
        {title:'异常前油量',value:typeof props.beforeOilMass=='number'?`${props.beforeOilMass}L`:''},
        {title:'异常后油量',value: typeof props.afterOilMass=='number'?`${props.afterOilMass}L`:''},
        {title:'异常量',value:typeof props.exceptionOilMass=='number'?`${props.exceptionOilMass}L`:''},
        {title:'异常地址',value:props.exceptionAddress||''},
    ];
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
        </div>
    )
}

export default LeftPanel;