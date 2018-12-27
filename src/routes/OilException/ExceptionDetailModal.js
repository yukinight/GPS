/*油耗异常 查看详情*/
import React from 'react';
import { Modal, Button, Form, Row, Col, Spin } from 'antd';
import moment from 'moment';
import ReactEcharts from 'echarts-for-react';
import { VtxMap } from 'vtx-ui';
import styles from './ExceptionDetailModal.less'
import { REFUEL_ICON } from '../../utils/refuelIcon';
import { GPS_ICON} from '../../utils/iconMap';
const FormItem = Form.Item;
const { VtxOptMap } = VtxMap;

class ExceptionDetailModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            exceptionVisible: false,
        }
    }
    //打开弹窗
    showModalHandler = () => {
        const { dispatch, record } = this.props;
        //判断是油耗异常还是隔夜异常
        if (record.exceptionTypeCode === 'OIL_REDUCE') {//油耗异常
            dispatch({
                type: 'oilException/getNormalDetail',
                payload: {
                    carId: record.carId,
                    startTime: record.beforeTime,
                    endTime: record.afterTime,
                }
            })
        } else if (record.exceptionTypeCode === 'OIL_REDUCE_DIF_DAY') {//隔夜异常
            dispatch({
                type: 'oilException/getDiffDetail',
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
            exceptionVisible: false
        })
    }
    //关闭异常点信息弹窗
    hideExceptionModalHandler = () => {
        this.setState({
            exceptionVisible: false
        })
    }
    //地图点点击事件
    clickPoint = (obj) => {
        //判断是否为异常点
        if (obj.attributes && obj.attributes.name === 'exception') {
            this.setState({
                exceptionVisible: true
            })
        }
    }
    render() {
        const { children } = this.props;
        const t = this;
        const formItemLayout = {
            labelCol: { span: 6 },
            wrapperCol: { span: 16 }
        }
        const exceptionFormItemLayout = {
            labelCol: { span: 7 },
            wrapperCol: { span: 15 },
        }
        const { getFieldDecorator } = this.props.form;
        const { carCode, carClassesName, exceptionTypeName, beforeOilMass, afterOilMass, exceptionOilMass, exceptionTime,
            doReason, exceptionAddress, exceptionTypeCode, beforeTime, afterTime } = this.props.record;
        const { detail, mapType, wkid, mapServer, minZoom, maxZoom, setVisiblePoints, detailLoading } = this.props;
        const { oilLineData, exceptionPointData, oilLineData2 } = detail;
        const oilOption = { //油耗曲线配置(油耗异常的油耗曲线以及隔夜异常的第一天的油耗曲线)
            title: {
                text: moment(beforeTime).format('YYYY-MM-DD'),
                left: 'center',
                textStyle: {
                    fontSize: 13,
                    fontWeight: 'lighter'
                }
            },
            xAxis: {
                type: 'category',
                data: oilLineData.oilLine ? oilLineData.oilLine.map((item, index) => {
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
                data: oilLineData.oilLine ? oilLineData.oilLine.map((item, index) => {
                    return item[1].toFixed(2) || 0
                }) : [],
                markPoint: exceptionTypeCode === 'OIL_REDUCE' ? {
                    symbol: 'rect',
                    itemStyle: {
                        color: '#57ad37',
                    },
                    emphasis: {
                        label: {
                            show: true,
                            position: 'bottom',
                            formatter: '减少油量' + exceptionOilMass + 'L'
                        }
                    },
                    symbolSize: [50, 25],
                    data: [{

                        name: '异常点',
                        value: exceptionPointData.length > 0 ? exceptionPointData[0].afterOilMass.toFixed(2) : 0,
                        coord: [exceptionPointData.length > 0 ? moment(exceptionPointData[0].exceptionTime).format('HH:mm') : 0,
                        exceptionPointData.length > 0 ? exceptionPointData[0].afterOilMass.toFixed(2) : 0],
                    }]
                } : {},
            }]
        }
        const oilOption2 = { //油耗曲线配置(隔夜异常的第二天的油耗曲线)
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
        let mapPoints = []; //展示的点
        let paths = []; //展示的路线
        //异常点数据
        exceptionPointData ? exceptionPointData.map((item, index) => {
            mapPoints.push({
                name: 'exception',
                id: item.id,
                longitude: item.longitude,
                latitude: item.latitude,
                url: GPS_ICON.map.abnormal
            })
        }) : '';
        //行驶路线数据
        oilLineData.allPoints ? oilLineData.allPoints.map((item, index) => {
            paths.push([item.gpsLongitude, item.gpsLatitude]);//绘制线路
            if (index === 0) {//添加起点
                mapPoints.push({
                    name: 'start',
                    id: item.id,
                    longitude: item.gpsLongitude,
                    latitude: item.gpsLatitude,
                    url: REFUEL_ICON.map.start
                })
            } else if (index === oilLineData.allPoints.length - 1)//添加终点
            {
                mapPoints.push({
                    name: 'end',
                    id: item.id,
                    longitude: item.gpsLongitude,
                    latitude: item.gpsLatitude,
                    url: REFUEL_ICON.map.end
                })
            }
        }) : '';
        //地图参数
        const mapProps = {
            mapPoints,
            mapLines: paths.length > 0 ? [{
                id: 'oilLine',
                paths,
            }] : [],
            mapId: this.props.record.id,
            wkid,
            mapType,
            mapServer, minZoom, maxZoom,
            mapVisiblePoints: {
                fitView: 'line',
                type: 'all'
            },
            setVisiblePoints,
            clickGraphic: t.clickPoint
        }
        return (
            <span>
                <span onClick={this.showModalHandler}>
                    {children}
                </span>
                <Modal
                    visible={this.state.visible}
                    onCancel={this.hideModalHandler}
                    maskClosable={false}
                    width={800}
                    title={<span>油耗异常查询 > 查看详情</span>}
                    footer={([
                        <Button key="back" size="large" onClick={this.hideModalHandler}>关闭</Button>,
                    ])}
                    bodyStyle={{ background: '#fbfbfb' }}
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
                                    label="异常类型"
                                    {...formItemLayout}
                                >
                                    {
                                        getFieldDecorator('exceptionTypeName', {
                                            initialValue: exceptionTypeName
                                        })(
                                            <span className="ant-form-text">{exceptionTypeName}</span>
                                        )
                                    }
                                </FormItem>
                            </Col>
                            <Col span={12}>
                                <FormItem
                                    label="减少前油量"
                                    {...formItemLayout}
                                >
                                    {
                                        getFieldDecorator('beforeOilMass', {
                                            initialValue: beforeOilMass ? (beforeOilMass + 'L') : ''
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
                                    label="减少后油量"
                                    {...formItemLayout}
                                >
                                    {
                                        getFieldDecorator('afterOilMass', {
                                            initialValue: afterOilMass ? (afterOilMass + 'L') : ''
                                        })(
                                            <span className="ant-form-text">{afterOilMass ? (afterOilMass + 'L') : ''}</span>
                                        )
                                    }
                                </FormItem>
                            </Col>
                            <Col span={12}>
                                <FormItem
                                    label="减少油量"
                                    {...formItemLayout}
                                >
                                    {
                                        getFieldDecorator('exceptionOilMass', {
                                            initialValue: exceptionOilMass ? (exceptionOilMass + 'L') : ''
                                        })(
                                            <span className="ant-form-text">{exceptionOilMass ? (exceptionOilMass + 'L') : ''}</span>
                                        )
                                    }
                                </FormItem>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={24}>
                                <FormItem
                                    label="异常时间"
                                    labelCol={{ span: 3 }}
                                    wrapperCol={{ span: 19 }}
                                >
                                    {
                                        getFieldDecorator('exceptionTime', {
                                            initialValue: exceptionTime
                                        })(
                                            <span className="ant-form-text">{exceptionTime}</span>
                                        )
                                    }
                                </FormItem>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={24}>
                                <FormItem
                                    label="处理原因"
                                    labelCol={{ span: 3 }}
                                    wrapperCol={{ span: 19 }}
                                >
                                    {
                                        getFieldDecorator('doReason', {
                                            initialValue: doReason
                                        })(
                                            <span className="ant-form-text">{doReason}</span>
                                        )
                                    }
                                </FormItem>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={24}>
                                <FormItem
                                    label="异常地址"
                                    labelCol={{ span: 3 }}
                                    wrapperCol={{ span: 19 }}
                                >
                                    {
                                        getFieldDecorator('exceptionAddress', {
                                            initialValue: exceptionAddress
                                        })(
                                            <span className="ant-form-text">{exceptionAddress}</span>
                                        )
                                    }
                                </FormItem>
                            </Col>
                        </Row>
                    </Form>
                    {
                        exceptionTypeCode === 'OIL_REDUCE' ?//油耗异常 油耗曲线加地图
                            <Spin spinning={detailLoading}>
                                <div className={styles.chart}>
                                    {
                                        oilLineData.oilLine&&oilLineData.oilLine.length>0 ?
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

                                </div>
                                <div className={styles.map}>
                                    <VtxOptMap
                                        {...mapProps}
                                        getMapInstance={(map) => { if (map) this.map = map }}
                                    />
                                </div>
                            </Spin>
                            ://隔夜异常 两个油耗曲线
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
                    {/*油耗异常点详细信息弹窗*/}
                    <Modal
                        visible={this.state.exceptionVisible}
                        onCancel={this.hideExceptionModalHandler}
                        maskClosable={false}
                        width={350}
                        title={<center>油耗异常点信息</center>}
                        footer={null}
                        mask={false}
                        style={{ top: 150 }}
                        bodyStyle={{ background: '#62a4fb' }}
                    >
                        <FormItem
                            label="车牌号"
                            {...exceptionFormItemLayout}
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
                            label="异常时间"
                            {...exceptionFormItemLayout}
                        >
                            {
                                getFieldDecorator('exceptionTime', {
                                    initialValue: exceptionTime
                                })(
                                    <span className="ant-form-text">{exceptionTime}</span>
                                )
                            }
                        </FormItem>
                        <FormItem
                            label="减少油量"
                            {...exceptionFormItemLayout}
                        >
                            {
                                getFieldDecorator('exceptionOilMass', {
                                    initialValue: exceptionOilMass ? (exceptionOilMass + 'L') : ''
                                })(
                                    <span className="ant-form-text">{exceptionOilMass ? (exceptionOilMass + 'L') : ''}</span>
                                )
                            }
                        </FormItem>
                        <FormItem
                            label="减少前油量"
                            {...exceptionFormItemLayout}
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
                            label="减少后油量"
                            {...exceptionFormItemLayout}
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
                            label="异常地址"
                            {...exceptionFormItemLayout}
                        >
                            {
                                getFieldDecorator('exceptionAddress', {
                                    initialValue: exceptionAddress
                                })(
                                    <span className="ant-form-text">{exceptionAddress}</span>
                                )
                            }
                        </FormItem>
                    </Modal>
                </Modal>
            </span>
        )
    }
}
export default Form.create()(ExceptionDetailModal);