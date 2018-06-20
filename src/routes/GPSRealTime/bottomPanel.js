import React from 'react';
import style from './bottomPanel.less';
import st2 from './index.less';
import { Tabs,Input,Button,Icon,Tooltip } from 'antd';
import ReactEcharts from 'echarts-for-react';
import ScrollTable from './scrollTable';
const TabPane = Tabs.TabPane;

class BottomPanel extends React.Component{
    constructor(props){
        super();
        this.state = {
            show:true,
            currentTabKey:'track',
        }
    }
    isOilTab(){
        return this.state.currentTabKey=='oil';
    }
    toggleBottomPanel(){
        this.setState({
            show: !this.state.show       
        })
    }
    render(){
        const t = this;
        const {carsInfo,realDataCfg,alarmInfoCfg,currentClickPoint,pageStatus,
            carOilData,oilChartLoading,nearbyCarIds,nearbyDistance,trackCfg,
            carStatistics,bkCfg} = this.props.data;
        const {pickOneCar,batchUpdatePointAddress,update,queryNearbyCar,
            getOilLine,showStatisticChart} = this.props;
        
        // ----------------实时数据------------
        // 如果车辆的油耗类型为消耗量，当前油量（oilMass）作废，保留当日油耗（consumeOil）；若非消耗量，当日油耗（consumeOil）数据作废，保留当前油量
        // 是否隐藏当前油量列（oilMass）
        let hideOilMassCol = realDataCfg.carIds.every((id)=>carsInfo[id].oilMeasureType=='消耗量');
        // 是否隐藏当日油耗列（consumeOil）
        let hideConsumeOilCol = realDataCfg.carIds.every((id)=>carsInfo[id].oilMeasureType!='消耗量');
        const realDataTableProps = {
            data:{
                columns:realDataCfg.columns.filter((item)=>{
                    if(hideOilMassCol && item.dataKey=='oilMass'){
                        return false;
                    }
                    if(hideConsumeOilCol && item.dataKey=='consumeOil'){
                        return false;
                    }
                    return true;
                }),
                tableData:realDataCfg.carIds.map((id,index)=>{
                    const thisCarInfo = carsInfo[id];
                    return {
                        ...thisCarInfo,
                        index:index+1,
                        oilMass:thisCarInfo.oilMeasureType=='消耗量'?'-':thisCarInfo.oilMass,
                        consumeOil:thisCarInfo.oilMeasureType!='消耗量'?'-':thisCarInfo.consumeOil,
                    }
                })
            },
            rowClick(rowData){
                pickOneCar(rowData.carId);
            },
            onScroll(topIndex){
                const endIndex = topIndex+10>realDataCfg.carIds.length?realDataCfg.carIds.length:topIndex+10;
                batchUpdatePointAddress(realDataCfg.carIds.slice(topIndex,endIndex))
            }
        }
        // ----------------报警数据----------------
        const alarmTableProps = {
            data:{
                columns:alarmInfoCfg.columns,
                tableData:alarmInfoCfg.alarmData.map((item,index)=>({
                    ...item,
                    index:index+1
                }))
            }
        }
        // -------------车辆跟踪数据--------------------
        hideOilMassCol = trackCfg.trackRecord.every((item)=>item.oilMeasureType=='消耗量');
        hideConsumeOilCol = trackCfg.trackRecord.every((item)=>item.oilMeasureType!='消耗量');
        const trackTableProps = {
            data:{
                columns:realDataCfg.columns.filter((item)=>{
                    if(hideOilMassCol && item.dataKey=='oilMass'){
                        return false;
                    }
                    if(hideConsumeOilCol && item.dataKey=='consumeOil'){
                        return false;
                    }
                    return true;
                }),
                tableData:trackCfg.trackRecord.map((item,index)=>({
                    ...item,
                    index:index+1,
                    oilMass:item.oilMeasureType=='消耗量'?'-':item.oilMass,
                    consumeOil:item.oilMeasureType!='消耗量'?'-':item.consumeOil,
                }))
            },
            rowClick(rowData){
                pickOneCar(rowData.carId);
            },
            onScroll(topIndex){
                const endIndex = topIndex+10>trackCfg.trackPointsId.length?trackCfg.trackPointsId.length:topIndex+10;
                // batchUpdatePointAddress(trackCfg.trackPointsId.slice(topIndex,endIndex))
            }
        }

        const oilLineOption ={
            tooltip: {
                trigger: 'axis'
            },
            grid:{
                left:'60px',
                right:'60px',
                top:'10px',
                bottom:'30px'
            },
            xAxis:  {
                type: 'category',
                boundaryGap: false,
                data: carOilData.lineData.map( item=> item[0]),
            },
            yAxis: {
                type: 'value',
                axisLabel: {
                    formatter: '{value}'
                }
            },
            series: [
                {
                    name:'油量(L)',
                    type:'line',
                    data:carOilData.lineData.map( item=>item[1]),
                }
            ]
        };

        // 附近车辆
        hideOilMassCol = nearbyCarIds.filter(id=>id in carsInfo).every((id)=>carsInfo[id].oilMeasureType=='消耗量');
        hideConsumeOilCol = nearbyCarIds.filter(id=>id in carsInfo).every((id)=>carsInfo[id].oilMeasureType!='消耗量');
        const nearbyCarsTableProps = {
            data:{
                columns:realDataCfg.columns.filter((item)=>{
                    if(hideOilMassCol && item.dataKey=='oilMass'){
                        return false;
                    }
                    if(hideConsumeOilCol && item.dataKey=='consumeOil'){
                        return false;
                    }
                    return true;
                }),
                tableData:nearbyCarIds.filter(id=>id in carsInfo).map((id,index)=>{
                    return {
                        ...carsInfo[id],
                        index:index+1,
                        oilMass:carsInfo[id].oilMeasureType=='消耗量'?'-':carsInfo[id].oilMass,
                        consumeOil:carsInfo[id].oilMeasureType!='消耗量'?'-':carsInfo[id].consumeOil,
                    }
                })
            },
            rowClick(rowData){
                pickOneCar(rowData.carId);
            },
            onScroll(topIndex){
                const endIndex = topIndex+10>nearbyCarIds.length?nearbyCarIds.length:topIndex+10;
                batchUpdatePointAddress(nearbyCarIds.slice(topIndex,endIndex))
            }
        }

        // 车辆信息统计栏
        const carStatisticBarProps = {
            ...carStatistics,
            showStatisticChart,
            showAlarm:bkCfg.isShowAlarm,
            alarmNumber:alarmInfoCfg.alarmData.length
        }

        const RightTopCornerTool = <div className={style.cornerTool}>
            {/* 当前是附近车辆tab，显示半径搜索框 */}
            {bkCfg.isNearCar && t.state.currentTabKey=='nearby' ? <span>
                半径<Input style={{width:50}} value={nearbyDistance} onChange={(e)=>{
                    if(e.target.value==='' || Number(e.target.value)){
                        update({
                            bottomPanelCfg:{
                                nearbyDistance:e.target.value
                            }
                        })
                    }
                }}/>米
                <Button size='small' type='primary' style={{margin:'0 5px'}} onClick={()=>{
                    queryNearbyCar();
                }}>确定</Button>
            </span>:null}
            {
                t.state.show?<Icon type="down" className={style.arrow} onClick={()=>{
                    t.toggleBottomPanel();
                }}/>:
                <Icon type="up" className={style.arrow} onClick={()=>{
                    t.toggleBottomPanel();
                }}/>
            }
        </div>

        return (
            <div className={`${t.state.show?style.bottomPanel:style.hiddenBottom} ${st2.bottomArea}`}>
                <Tabs defaultActiveKey="realData" tabBarExtraContent={RightTopCornerTool} onChange={(tabKey)=>{
                    t.setState({
                        currentTabKey:tabKey
                    })
                    if(tabKey=='oil'){
                        getOilLine();
                    }
                }}>
                    {
                        pageStatus!='normal'?<TabPane tab="跟踪车辆" key="track">
                            <ScrollTable {...trackTableProps} />
                        </TabPane>
                        :
                        <TabPane tab="实时数据" key="realData">
                            <ScrollTable {...realDataTableProps} />
                        </TabPane>
                    }

                    {
                        bkCfg.isShowAlarm?<TabPane tab="报警信息" key="alarm">
                            <ScrollTable {...alarmTableProps} />
                        </TabPane>:null
                    }
                    
                    {
                        bkCfg.isOil && currentClickPoint.pType=='car'?<TabPane tab="油量曲线" key="oil">
                            <p style={{textAlign:'left',paddingLeft:'34px',lineHeight:'26px'}} key='oilTitle'>
                                {carOilData.oilMeasureType=='XHL'?'消耗量(L)':'油量(L)'}
                                <span style={{marginLeft:'10%'}}>
                                    {carOilData.carCode}
                                    <span style={{marginLeft:'30px'}}>总油耗：{carOilData.sumOilUse}L</span>
                                    <span style={{marginLeft:'30px'}}>总里程：{carOilData.sumMileage}km</span>
                                </span>
                            </p>,
                            <ReactEcharts key='oil' 
                            option={oilLineOption} 
                            notMerge={true} 
                            lazyUpdate={true} 
                            style={{height:'220px'}}
                            showLoading={oilChartLoading}
                            loadingOption={{text:'加载中...'}}
                            />
                        </TabPane>
                            
                        :null
                    }
                    {
                        bkCfg.isNearCar && currentClickPoint.pType=='car'?<TabPane tab="附近车辆" key="nearby">
                            <ScrollTable {...nearbyCarsTableProps} />
                        </TabPane>:null
                    }
                    
                </Tabs>
                <CarStatisticBar {...carStatisticBarProps}/>
            </div>
        )
    }
}

function CarStatisticBar(props){
    let remindInfoNumber = 0;
    if(props.remindMap){
        for(let k in props){
            let k_num = Number(props.remindMap[k]);
            if(k_num)
                remindInfoNumber += k_num;
        }
    }
    let msg = '';
    if(props.carStatusMap){
        for(let k in props.carStatusMap){
            msg += `${k}: ${props.carStatusMap[k]}辆；`
        }
    }
    return (
        <div className={style.infoBar}>
            <div className={style.statistic} onClick={props.showStatisticChart}><Icon type="pie-chart" />{'  统计详情'}</div>
            <Tooltip title={`选定车辆：${props.totalCarNum}辆；${msg}`}>
                <div style={{width:'50%'}}>选定车辆：{props.totalCarNum}辆；{msg}</div>
            </Tooltip>
            {props.showAlarm?<div>共{props.alarmNumber}条报警信息</div>:null}
            <div>共{remindInfoNumber}条提醒信息</div>
        </div>
    )
}

export default BottomPanel;