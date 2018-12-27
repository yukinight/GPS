/*加油查询 油量查询弹框 */
import React from 'react';
import { Modal, Button, Form, Row, Col, Spin } from 'antd';
import moment from 'moment';
import ReactEcharts from 'echarts-for-react';
import { VtxMap } from 'vtx-ui';
import styles from './RefuelDetailModal.less'
import { REFUEL_ICON} from '../../utils/refuelIcon';
const FormItem = Form.Item;
const { VtxOptMap } = VtxMap;

class RefuelDetailModal extends React.Component{
    constructor(props){
        super(props);
        this.state={
            visible: false,
            addoilVisible:false,
        }
    }

    //打开弹窗
    showModalHandler = () => {
        const { dispatch,record} = this.props;
        //判断是正常加油还是隔夜加油
        if (record.addTypeCode ==='OIL_ADD'){//正常加油
            dispatch({
                type:'refuelList/getNormalDetail',
                payload:{
                    carId:record.carId,
                    startTime:record.beforeTime,
                    endTime:record.afterTime,
                }
            })
        } else if (record.addTypeCode === 'OIL_ADD_DIF_DAY'){//隔夜加油
            dispatch({
                type: 'refuelList/getAbnormalDetail',
                payload: {
                    carId: record.carId,
                    startTime: record.beforeTime,
                    endTime: record.afterTime,
                }
            })
        }
        this.setState({
            visible: true
        })
    }

    //关闭弹窗
    hideModalHandler = () => {
        this.setState({
            visible: false,
            addoilVisible: false
        })
    }
    //关闭加油点信息弹窗
    hideAddoilModalHandler=()=>{
        this.setState({
            addoilVisible:false
        })
    }
    //地图点点击事件
    clickPoint=(obj)=>{
        //判断是否为加油点
        if (obj.attributes&&obj.attributes.name==='addoil'){
            this.setState({
                addoilVisible:true
            })
        }
    }
    render(){
        const {children} = this.props;
        const t = this;
        const formItemLayout = {
            labelCol: { span:6 },
            wrapperCol: { span: 16 }
        }
        const addoilFormItemLayout = {
            labelCol: { span: 7 },
            wrapperCol: { span: 15 },
        }
        const { getFieldDecorator } = this.props.form;
        const { carCode, carClassesName, addTypeName, beforeOilMass, afterOilMass, addOilMass, addOilDateTime,
            billNo, addOilAddress, addTypeCode, beforeTime, afterTime} = this.props.record;
        const { detail, mapType, wkid, mapServer, minZoom,
            maxZoom, setVisiblePoints, detailLoading} = this.props;
        const { oilLineData, refuelPointData, oilLineData2} = detail;
        const oilOption = { //油耗曲线配置(正常加油的油耗曲线以及隔夜加油的第一天的油耗曲线)
            title:{
                text: moment(beforeTime).format('YYYY-MM-DD'),
                left:'center',
                textStyle:{
                    fontSize:13,
                    fontWeight:'lighter'
                }
            },
            xAxis:{
                type:'category',
                data: oilLineData.oilLine ? oilLineData.oilLine.map((item, index) => {
                    return moment(item[0]).format('HH:mm')
                }) : []
            },
            tooltip: {
                trigger: 'axis',
                formatter: '{b0}<br />油量(L): {c0}'
            },
            yAxis:{
                name:'油量(L)',
                type:'value',
            },
            series:[{
                type:'line',
                data: oilLineData.oilLine ? oilLineData.oilLine.map((item,index)=>{
                    return item[1].toFixed(2)||0
                }):[],
                markPoint: addTypeCode === 'OIL_ADD'?{
                    symbol:'rect',
                    itemStyle:{
                        color:'#57ad37',
                    },
                    emphasis:{
                        label:{
                            show:true,
                            position:'bottom',
                            formatter: '加油量：' + addOilMass+'L'
                        }
                    },
                    // label:{
                    //     show:true,
                    //     formatter:'加油量',
                    //     position:'bottom'
                    // },
                    symbolSize:[50,25],
                    data:[{

                        name:'加油点',
                        value: refuelPointData.length > 0 ? refuelPointData[0].afterOilMass.toFixed(2) : 0,
                        coord: [refuelPointData.length > 0 ? moment(refuelPointData[0].addOilDateTime).format('HH:mm') : 0,
                            refuelPointData.length > 0 ? refuelPointData[0].afterOilMass.toFixed(2) : 0],
                        // xAxis: '09:26:30',
                        // // xAxis: refuelPointData.length > 0 ? moment(refuelPointData.addOilDateTime).format('HH:mm:ss'):0,
                        // yAxis: refuelPointData.length > 0 ? refuelPointData[0].afterOilMass.toFixed(2):0,
                    }]
                }:{},
            }]
        }
        const oilOption2 = { //油耗曲线配置(隔夜加油的第二天的油耗曲线)
            title: {
                text: moment(afterTime).format('YYYY-MM-DD'),
                left: 'center',
                textStyle: {
                    fontSize: 13,
                    fontWeight: 'lighter'
                }
            },
            xAxis: {
                type: 'category',
                data: oilLineData2.oilLine ? oilLineData2.oilLine.map((item, index) => {
                    return moment(item[0]).format('HH:mm')
                }) : []
            },
            tooltip: {
                trigger: 'axis',
                formatter: '{b0}<br />油量(L): {c0}'
            },
            yAxis: {
                name: '油量(L)',
                type: 'value',
            },
            series: [{
                type: 'line',
                data: oilLineData2.oilLine ? oilLineData2.oilLine.map((item, index) => {
                    return item[1].toFixed(2) || 0
                }) : [],
            }]
        }
        let mapPoints=[]; //展示的点
        let paths=[]; //展示的路线
        //加油点数据
        refuelPointData ? refuelPointData.map((item,index)=>{
            mapPoints.push({
                name:'addoil',
                id:item.id,
                longitude: item.longitude,
                latitude: item.latitude,
                url: REFUEL_ICON.map.addoil
            })
        }):'';
        //行驶路线数据
        oilLineData.allPoints?oilLineData.allPoints.map((item,index)=>{
            paths.push([item.gpsLongitude,item.gpsLatitude]);//绘制线路
            if(index===0){//添加起点
                mapPoints.push({
                    name: 'start',
                    id:item.id,
                    longitude: item.gpsLongitude,
                    latitude:item.gpsLatitude,
                    url:REFUEL_ICON.map.start
                })
            }else if(index === oilLineData.allPoints.length-1)//添加终点
            {
                mapPoints.push({
                    name: 'end',
                    id: item.id,
                    longitude: item.gpsLongitude,
                    latitude: item.gpsLatitude,
                    url: REFUEL_ICON.map.end
                })
            }
        }):'';
        //地图参数
        const mapProps={
            mapPoints,
            mapLines:paths.length>0?[{
                id:'oilLine',
                paths,
            }]:[],
            mapId:this.props.record.id,
            wkid,
            mapType,
            mapServer, minZoom,
            maxZoom,
            mapVisiblePoints:{
                fitView: 'line',
                type:'all'
            },
            setVisiblePoints,
            clickGraphic:t.clickPoint
        }
        return(
            <span>
                <span onClick={this.showModalHandler}>
                    {children}
                </span>
                <Modal
                    visible={this.state.visible}
                    onCancel={this.hideModalHandler}
                    maskClosable={false}
                    width={800}
                    title={<span>加油查询管理 > 查看详情</span>}
                    footer={([
                        <Button key="back" size="large" onClick={this.hideModalHandler}>关闭</Button>,
                    ])}
                    bodyStyle={{ background:'#fbfbfb'}}
                >
                    <Form>
                        <Row>
                            <Col span={12}>
                                <FormItem
                                    label="车牌号"
                                    {...formItemLayout}
                                >
                                    {
                                        getFieldDecorator('carCode', {
                                            initialValue: carCode
                                        })(
                                            <span className="ant-form-text">{carCode}</span>
                                        )
                                    }
                                </FormItem>
                            </Col>
                            <Col span={12}>
                                <FormItem
                                    label="车辆类型"
                                    {...formItemLayout}
                                >
                                    {
                                        getFieldDecorator('carClassesName', {
                                            initialValue: carClassesName
                                        })(
                                            <span className="ant-form-text">{carClassesName}</span>
                                        )
                                    }
                                </FormItem>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={12}>
                                <FormItem
                                    label="加油类型"
                                    {...formItemLayout}
                                >
                                    {
                                        getFieldDecorator('addTypeName', {
                                            initialValue: addTypeName
                                        })(
                                            <span className="ant-form-text">{addTypeName}</span>
                                        )
                                    }
                                </FormItem>
                            </Col>
                            <Col span={12}>
                                <FormItem
                                    label="加油前油量"
                                    {...formItemLayout}
                                >
                                    {
                                        getFieldDecorator('beforeOilMass', {
                                            initialValue: beforeOilMass?(beforeOilMass+'L'):''
                                        })(
                                            <span className="ant-form-text">{beforeOilMass ? (beforeOilMass + 'L') : ''}</span>
                                        )
                                    }
                                </FormItem>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={12}>
                                <FormItem
                                    label="加油后油量"
                                    {...formItemLayout}
                                >
                                    {
                                        getFieldDecorator('afterOilMass', {
                                            initialValue: afterOilMass?(afterOilMass+'L'):''
                                        })(
                                            <span className="ant-form-text">{afterOilMass ? (afterOilMass + 'L') : ''}</span>
                                        )
                                    }
                                </FormItem>
                            </Col>
                            <Col span={12}>
                                <FormItem
                                    label="加油量"
                                    {...formItemLayout}
                                >
                                    {
                                        getFieldDecorator('addOilMass', {
                                            initialValue: addOilMass?(addOilMass+'L'):''
                                        })(
                                            <span className="ant-form-text">{addOilMass ? (addOilMass + 'L') : ''}</span>
                                        )
                                    }
                                </FormItem>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={12}>
                                <FormItem
                                    label="加油时间"
                                    {...formItemLayout}
                                >
                                    {
                                        getFieldDecorator('addOilDateTime', {
                                            initialValue: moment(addOilDateTime).format('YYYY-MM-DD')
                                        })(
                                            <span className="ant-form-text">{moment(addOilDateTime).format('YYYY-MM-DD')}</span>
                                        )
                                    }
                                </FormItem>
                            </Col>
                            <Col span={12}>
                                <FormItem
                                    label="参考加油票号"
                                    {...formItemLayout}
                                >
                                    {
                                        getFieldDecorator('billNo', {
                                            initialValue: billNo
                                        })(
                                            <span className="ant-form-text">{billNo}</span>
                                        )
                                    }
                                </FormItem>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={24}>
                                <FormItem
                                    label="加油地址"
                                    labelCol={{span: 3 }}
                                    wrapperCol= {{span: 19 }}
                                >
                                    {
                                        getFieldDecorator('addOilAddress', {
                                            initialValue: addOilAddress
                                        })(
                                            <span className="ant-form-text">{addOilAddress}</span>
                                        )
                                    }
                                </FormItem>
                            </Col>
                        </Row>
                    </Form>
                    {
                        addTypeCode === 'OIL_ADD'?//正常加油 油耗曲线加地图
                        <Spin spinning={detailLoading}>
                            <div className={styles.chart}>
                            {
                                oilLineData.oilLine && oilLineData.oilLine.length > 0?
                                    <ReactEcharts
                                        option={oilOption}
                                        notMerge
                                        lazyUpdate
                                        style={{
                                            height: '300px',
                                            width: '100%'
                                        }}
                                    />
                                :<center>无油量数据</center>
                            }
                                
                            </div>
                            <div className={styles.map}>
                                <VtxOptMap
                                    {...mapProps}
                                    getMapInstance={(map)=>{if(map)this.map=map}} 
                                />
                            </div>
                        </Spin>
                        ://隔夜加油 两个油耗曲线
                            <Spin spinning={detailLoading}>
                                <div className={styles.chart}>
                                    {
                                        oilLineData.oilLine && oilLineData.oilLine.length > 0 ?
                                            <ReactEcharts
                                                option={oilOption}
                                                notMerge
                                                lazyUpdate
                                                style={{
                                                    height: '300px',
                                                    width: '100%'
                                                }}
                                            />
                                            : <center>无油量数据</center>
                                    }
                                    {
                                        oilLineData2.oilLine && oilLineData2.oilLine.length > 0 ?
                                            <ReactEcharts
                                                option={oilOption2}
                                                notMerge
                                                lazyUpdate
                                                style={{
                                                    height: '300px',
                                                    width: '100%'
                                                }}
                                            />
                                            : <center>无油量数据</center>
                                    }

                                </div>
                            </Spin>
                    }
                    {/*加油点详细信息弹窗*/}
                    <Modal
                        visible={this.state.addoilVisible}
                        onCancel={this.hideAddoilModalHandler}
                        maskClosable={false}
                        width={350}
                        title={<center>车辆加油点信息</center>}
                        footer={null}
                        mask={false}
                        style={{ top: 150 }}
                        bodyStyle={{background:'#62a4fb'}}
                    >
                        <FormItem
                            label="车牌号"
                            {...addoilFormItemLayout}
                        >
                            {
                                getFieldDecorator('carCode', {
                                    initialValue: carCode
                                })(
                                    <span className="ant-form-text">{carCode}</span>
                                )
                            }
                        </FormItem>
                        <FormItem
                            label="上传时间"
                            {...addoilFormItemLayout}
                        >
                            {
                                getFieldDecorator('addOilDateTime', {
                                    initialValue: addOilDateTime
                                })(
                                    <span className="ant-form-text">{addOilDateTime}</span>
                                )
                            }
                        </FormItem>
                        <FormItem
                            label="加油量"
                            {...addoilFormItemLayout}
                        >
                            {
                                getFieldDecorator('addOilMass', {
                                    initialValue: addOilMass ? (addOilMass + 'L') : ''
                                })(
                                    <span className="ant-form-text">{addOilMass ? (addOilMass + 'L') : ''}</span>
                                )
                            }
                        </FormItem>
                        <FormItem
                            label="加油前油量"
                            {...addoilFormItemLayout}
                        >
                            {
                                getFieldDecorator('beforeOilMass', {
                                    initialValue: beforeOilMass ? (beforeOilMass + 'L') : ''
                                })(
                                    <span className="ant-form-text">{beforeOilMass ? (beforeOilMass + 'L') : ''}</span>
                                )
                            }
                        </FormItem>
                        <FormItem
                            label="加油后油量"
                            {...addoilFormItemLayout}
                        >
                            {
                                getFieldDecorator('afterOilMass', {
                                    initialValue: afterOilMass ? (afterOilMass + 'L') : ''
                                })(
                                    <span className="ant-form-text">{afterOilMass ? (afterOilMass + 'L') : ''}</span>
                                )
                            }
                        </FormItem>
                        <FormItem
                            label="加油地址"
                            {...addoilFormItemLayout}
                        >
                            {
                                getFieldDecorator('addOilAddress', {
                                    initialValue: addOilAddress 
                                })(
                                    <span className="ant-form-text">{addOilAddress}</span>
                                )
                            }
                        </FormItem>
                    </Modal>
                </Modal>
            </span>
        )
    }
}
export default Form.create()(RefuelDetailModal);