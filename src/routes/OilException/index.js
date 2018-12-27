import React from 'react';
import { connect } from 'dva';
import moment from 'moment';
import { Select, Input, TreeSelect, message } from 'antd';
import { VtxGrid, VtxDate, VtxDatagrid, VtxExport } from 'vtx-ui';
import styles from './index.less'
import { getBaicPostData } from '../../utils/util';
import  ExceptionDetailModal from './ExceptionDetailModal';
import HandleExceptionModal from './HandleExceptionModal';
const Option = Select.Option;
const VtxRangePicker = VtxDate.VtxRangePicker;

class OilException extends React.Component {
    constructor(props) {
        super(props)
    }
    componentDidMount = () => {
        const { dispatch } = this.props;
        dispatch({ type: 'common/getTenantInfo' }).then(() => {
            dispatch({ type: 'oilException/setMapCfg' });
        })
    }
    onQuery = () => {
        this.props.dispatch({
            type: 'oilException/updateState',
            payload: {
                currentPage: 1,
                pageSize: 10,
            }
        })
        this.props.dispatch({
            type: 'oilException/getTableData'
        })
    }
    onClear = () => {
        this.props.dispatch({
            type: 'oilException/updateState',
            payload: {
                company: '',
                handleStatus: '',
                carCode: '',
                startDate: moment().subtract(1, 'days').format('YYYY-MM-DD'),
                endDate: moment().format('YYYY-MM-DD'),
                currentPage:1,
                pageSize:10,
            }
        })
        this.props.dispatch({
            type: 'oilException/getCarCodeTree'
        })
        this.props.dispatch({
            type: 'oilException/getTableData'
        })
    }
    changeCompany = (value) => {
        this.props.dispatch({
            type: 'oilException/updateState',
            payload: {
                company: value
            }
        })
        this.props.dispatch({
            type: 'oilException/getCarCodeTree'
        })
    }
    changeCarCode = (value) => {
        this.props.dispatch({
            type: 'oilException/updateState',
            payload: {
                carCode: value
            }
        })
    }
    changeHandleStatus = (value) => {
        this.props.dispatch({
            type: 'oilException/updateState',
            payload: {
                handleStatus: value
            }
        })
        this.props.dispatch({
            type: 'oilException/getCarCodeTree'
        })
    }
    disabledDate = (current) => {
        return current > moment()
    }
    changeDate = (dates, dateString) => {
        this.props.dispatch({
            type: 'oilException/updateState',
            payload: {
                startDate: dateString[0],
                endDate: dateString[1]
            }
        })
        this.props.dispatch({
            type: 'oilException/getTableData'
        })
    }
    render(){
        const t  = this;
        const dispatch = t.props.dispatch;
        const { company, companyTree, handleStatus, handleStatusSelect, carCode, carCodeTree,
            startDate, endDate, tableData, currentPage, pageSize, totalItems, loading, detail,
             detailLoading, setVisiblePoints, handleResult,handleReason } = t.props.oilException;
        const { mapType, mapServer, minZoom, maxZoom, wkid, } = t.props.common
        let handleStatusOption = handleStatusSelect.map((item, index) => {
            return <Option value={item.value} key={item.value}>{item.text}</Option>
        })
        const modalProps = {
            mapType,//地图类型
            wkid,//坐标系编号与mapServer的wkid
            mapServer,
            minZoom, maxZoom,
            detail,
            detailLoading,
            setVisiblePoints,
            handleResult,
            handleReason
        }
        const handleStatusText={
            '0':'未处理',
            '1':'已通过',
            '-1':'未通过',
        }
        const columns = [{
            title: '作业单位',
            dataIndex: 'companyName',
            key: 'companyName',
            width: 100
        },{
            title:'车牌号',
            dataIndex:'carCode',
            key:'carCode',
            width:100
        },{
            title:'车辆类型',
            dataIndex:'carClassesName',
            key:'carClassesName',
            width:50
        },{
            title:'异常时间',
            dataIndex:'exceptionTime',
            key:'exceptionTime',
            width:100
        },{
            title:'异常类型',
            dataIndex:'exceptionTypeName',
            key:'exceptionTypeName',
            width:80
        },{
            title:'异常地址',
            dataIndex:'exceptionAddress',
            key:'exceptionAddress',
            width:200
        },{
            title:'减少油量(L)',
            dataIndex:'exceptionOilMass',
            key:'exceptionOilMass',
            width:50
        },{
            title:'处理状态',
            dataIndex:'manualHandleResult',
            key:'manualHandleResult',
            render:(text)=> handleStatusText[(text+'')],
            width:50
        },{
            title:'操作',
            dataIndex:'operation',
            key:'operation',
            width:80,
            render:(text,record)=>(
                <span>
                    <ExceptionDetailModal {...modalProps} record={record} id={record.id} dispatch={dispatch}>
                        <a>查看</a>
                    </ExceptionDetailModal>
                    {
                        record.manualHandleResult===0?
                            <span>
                            <span className='ant-divider' />
                            <HandleExceptionModal {...modalProps} record={record} id={record.id} dispatch={dispatch}>
                                <a>处理</a>
                            </HandleExceptionModal>
                            </span>
                        :''
                    }
                    
                </span>
            )
        }];
        const vProps = {
            columns,
            autoFit: true,
            loading,
            dataSource: tableData,
            rowKey: (record) => record.id,
            pagination: {
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '30', '40', '50'],
                showQuickJumper: true,
                current: currentPage,  //后端分页数据配置参数1
                total: totalItems, //后端分页数据配置参数2
                pageSize, //后端分页数据配置参数3
                // 当前页码改变的回调
                onChange(page, pageSize) {
                    dispatch({
                        type: 'oilException/updateState',
                        payload: {
                            currentPage: page,
                            pageSize,
                        }
                    })
                    dispatch({
                        type: 'oilException/getTableData',
                    })
                },
                // pageSize 变化的回调
                onShowSizeChange(current, size) {
                    dispatch({
                        type: 'oilException/updateState',
                        payload: {
                            currentPage: current,
                            pageSize: size,
                        }
                    })
                    dispatch({
                        type: 'oilException/getTableData',
                    })
                },
                showTotal: total => `合计 ${total} 条`,
            }
        }
        return (
            <div className={styles.normal}>
                <VtxGrid
                    titles={[
                        '作业单位', '处理状态', '车牌号', '查询时间'
                    ]}
                    gridweight={[1, 1, 1, 1]}
                    confirm={t.onQuery}
                    clear={t.onClear}
                >
                    <TreeSelect
                        required={false}
                        style={{ width: '100%'}}
                        dropdownStyle={{ maxHeight: '400px' }}
                        value={company}
                        treeData={companyTree}
                        treeDefaultExpandAll
                        showSearch
                        onChange={t.changeCompany}
                        treeNodeFilterProp="label"
                        dropdownMatchSelectWidth={false}
                    />
                    <Select
                        style={{ width: '100%' }}
                        value={handleStatus}
                        onChange={t.changeHandleStatus}
                    >
                        {handleStatusOption}
                    </Select>
                    <TreeSelect
                        required={false}
                        style={{ width: '100%' }}
                        dropdownStyle={{ maxHeight: '400px' }}
                        value={carCode}
                        treeData={carCodeTree}
                        treeDefaultExpandAll
                        showSearch
                        onChange={t.changeCarCode}
                        treeNodeFilterProp="label"
                        dropdownMatchSelectWidth={false}
                    />
                    <VtxRangePicker
                        value={[startDate, endDate]}
                        onChange={t.changeDate}
                        disabledDate={t.disabledDate}
                    />
                </VtxGrid>
                <div className={styles.tableContainer}>
                    <VtxDatagrid {...vProps} />
                </div>
            </div>
        )
    }
}
function mapStateToProps(state) {
    return { oilException: state.oilException,
        common: state.common }
}
export default connect(mapStateToProps)(OilException)
