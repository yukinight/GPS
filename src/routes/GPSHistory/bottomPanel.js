import React from 'react';
import style from './bottomPanel.less';
import st2 from './index.less';
import { Tabs,Input,Button,Icon,Tooltip } from 'antd';
import ReactEcharts from 'echarts-for-react';
import ScrollTable from '../GPSRealTime/scrollTable';
const TabPane = Tabs.TabPane;

class BottomPanel extends React.Component{
    constructor(props){
        super();
        this.state = {
            show:true,
            currentTabKey:'detail',
            speedLineValue:20,//速度分析警戒线
        }
        this.carPositionTable = null;
    }
    toggleBottomPanel(){
        this.setState({
            show: !this.state.show       
        })
    }
    scrollCarPositionTableToIndex(index){
        this.carPositionTable.scrollToIndex(index);
    }
    render(){
        const t = this;
        const {detail,alarm,stop,carPositions,carStopInfo,speedLineData,oilLine,
            alarmInfo,showStopCar,selectedCarPositionIndex,showOilTab,showAlarmTab,
            stopTimeInterval} = t.props.data;
        const {fetchAddressForCarPositions,clickCarPath,clickStopCar,
            updateStopTimeInterval,queryStopList} = t.props;
        // 右上角工具（包括收起展开按钮，文本框）
        const RightTopCornerTool = <div className={style.cornerTool}>
            {
                (function(){
                    switch(t.state.currentTabKey){
                        case 'speed':
                            return (
                                <span>
                                    警戒线 <Input style={{width:'40px',display:'inlineBlock'}} value={t.state.speedLineValue} onChange={(e)=>{
                                        const num = Number(e.target.value);
                                        if(!isNaN(num)){
                                            t.setState({
                                                speedLineValue:num
                                            })
                                        }
                                    }} /> km/h
                                </span>
                            );
                        case 'stop':
                            return (<span>
                                停车 <Input style={{width:'40px',display:'inlineBlock'}} value={stopTimeInterval} onChange={(e)=>{
                                    const num = Number(e.target.value);
                                    if(!isNaN(num)){
                                        updateStopTimeInterval(num);
                                    }
                                }} /> 分钟
                                <Button size='small' type='primary' style={{margin:'0 5px'}} onClick={()=>{
                                    queryStopList();
                                }}>确定</Button>
                            </span>);
                        default:
                            return null;
    
                    }
                })()
                
            }
            
            {
                t.state.show?<Icon type="down" className={style.arrow} onClick={()=>{
                    t.toggleBottomPanel();
                }}/>:
                <Icon type="up" className={style.arrow} onClick={()=>{
                    t.toggleBottomPanel();
                }}/>
            }
        </div>
        // 明细数据表格
        const detailTableProps = {
            data:{
                columns:detail.columns,
                tableData:carPositions,
                highlightRowIndex:selectedCarPositionIndex
            },
            ref(ins){
                if(ins)t.carPositionTable = ins;
            },
            rowClick(rowData,index){
                clickCarPath(index);
                // moveMapTo({center:[rowData.longitudeDone,rowData.latitudeDone]});                
            },
            onScroll(topIndex){
                const endIndex = topIndex+10>carPositions.length?carPositions.length:topIndex+10;
                fetchAddressForCarPositions(topIndex,endIndex);
            }
        }
        // 报警分析表格
        const alarmTableProps = {
            data:{
                columns:alarm.columns,
                tableData:alarmInfo
            }
        }
        // 停车分析表格
        const stopCarTableProps = {
            data:{
                columns:stop.columns,
                tableData:carStopInfo,
                showStopCar,//触发表格重绘
            },
            rowClick(rowData,index){
                clickStopCar(index);
                // if(showStopCar){
                //     moveMapTo({center:[rowData.longitudeDone,rowData.latitudeDone]});
                // }
            },
        }

        // 速度分析曲线配置
        const speedLineOption ={
            tooltip: {
                trigger: 'axis'
            },
            grid:{
                left:'80px',
                right:'80px',
                top:'40px',
                bottom:'30px'
            },
            xAxis:  {
                type: 'category',
                boundaryGap: false,
                data: speedLineData.map( item=> item.equipmentTime),
            },
            yAxis: {
                type: 'value',
                name:'速度(km/h)',
            },
            series: [
                {
                    name:'速度(km/h)',
                    type:'line',
                    showSymbol:false,
                    lineStyle:{
                        color: '#61A0A8'
                    },
                    data:speedLineData.map( item=> item.value),
                    markLine: {
                        data: [
                            {
                                name: '',
                                yAxis: t.state.speedLineValue
                            }
                        ]
                    }
                }
            ]
        };
        // 油耗曲线配置
        const oilLineOption ={
            tooltip: {
                trigger: 'axis'
            },
            grid:{
                left:'80px',
                right:'60px',
                top:'40px',
                bottom:'30px'
            },
            xAxis:  {
                type: 'category',
                boundaryGap: false,
                data:oilLine.lineData.map(item=>item[0]),
            },
            yAxis: {
                type: 'value',
                name:oilLine.oilMeasureType=='XHL'?'消耗量(L)':'油量(L)',
            },
            series: [
                {
                    name:oilLine.oilMeasureType=='XHL'?'消耗量(L)':'油量(L)',
                    type:'line',
                    showSymbol:false,
                    lineStyle:{
                        color: '#61A0A8'
                    },
                    data:oilLine.lineData.map(item=>item[1]),
                }
            ]
        };    
        return (
            <div className={`${t.state.show?style.bottomPanel:style.hiddenBottom} ${st2.bottomArea}`}>
                <Tabs defaultActiveKey="detail" tabBarExtraContent={RightTopCornerTool} 
                onChange={(tabKey)=>{
                    t.setState({
                        currentTabKey:tabKey
                    })
                }}>
                    <TabPane tab="明细数据" key="detail">
                        <ScrollTable {...detailTableProps}/>
                    </TabPane>
                    <TabPane tab="速度分析" key="speed">
                        <ReactEcharts option={speedLineOption} notMerge={true} lazyUpdate={true} style={{height:'250px'}}/>   
                    </TabPane>
                    {
                        showOilTab?<TabPane tab="油量分析" key="oil" style={{position:'relative'}}>
                            <p style={{position:'absolute',left:'200px',top:'5px',fontSize:'13px'}} >
                            {`总油耗：${typeof oilLine.sumOilUse =='number'?`${oilLine.sumOilUse}L`:'-'}, 总里程：${typeof oilLine.sumMileage =='number'?`${oilLine.sumMileage}km`:'-'}`}
                            </p>
                            <ReactEcharts  key={2} option={oilLineOption} notMerge={true} lazyUpdate={true} style={{height:'250px'}}/>
                        </TabPane>:null
                    }
                    {
                        showAlarmTab?<TabPane tab="报警分析" key="alarm">
                            <ScrollTable {...alarmTableProps}/>
                        </TabPane>:null
                    }
                    
                    <TabPane tab="停车分析" key="stop">
                        <ScrollTable {...stopCarTableProps}/>
                    </TabPane>
                 
                    
                </Tabs>
            </div>
        )
    }
}


export default BottomPanel;