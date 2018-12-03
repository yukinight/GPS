import React from 'react';
import { connect } from 'dva';
import moment from 'moment';
import { Select,Input,TreeSelect,message } from 'antd';
import { VtxGrid, VtxDate, VtxDatagrid, VtxExport } from 'vtx-ui';
import styles from './index.less'
import { getBaicPostData } from '../../utils/util';
import  RefuelDetailModal  from './RefuelDetailModal';
const Option = Select.Option;
const VtxRangePicker = VtxDate.VtxRangePicker;
const { VtxExport2 } = VtxExport;

class RefuelList extends React.Component{
    constructor(props){
        super(props)
    }
    componentDidMount=()=>{
        const {dispatch} = this.props;
        dispatch({ type: 'common/getTenantInfo' }).then(() => {
            dispatch({ type: 'refuelList/setMapCfg' });
        })
    }
    onQuery=()=>{
        this.props.dispatch({
            type: 'refuelList/updateState',
            payload: {
                currentPage: 1,
                pageSize: 10,
            }
        })
        this.props.dispatch({
            type:'refuelList/getTableData'
        })
    }
    onClear=()=>{
        this.props.dispatch({
            type:'refuelList/updateState',
            payload:{
                company:'',
                carClassesCode:'',
                carCode:'',
                startDate: moment().subtract(1, 'days').format('YYYY-MM-DD'),
                endDate: moment().format('YYYY-MM-DD'),
                currentPage: 1,
                pageSize: 10,
            }
        })
        this.props.dispatch({
            type: 'refuelList/getCarCodeTree'
        })
        this.props.dispatch({
            type: 'refuelList/getTableData'
        })
    }
    changeCompany=(value)=>{
        this.props.dispatch({
            type:'refuelList/updateState',
            payload:{
                company:value
            }
        })
        this.props.dispatch({
            type:'refuelList/getCarCodeTree'
        })
    }
    changeCarCode=(value)=>{
        this.props.dispatch({
            type: 'refuelList/updateState',
            payload: {
                carCode: value
            }
        })
    }
    changeCarClass=(value)=>{
        this.props.dispatch({
            type: 'refuelList/updateState',
            payload: {
                carClassesCode: value
            }
        })
        this.props.dispatch({
            type: 'refuelList/getCarCodeTree'
        })
    }
    disabledDate=(current)=>{
        return current>moment()
    }
    changeDate=(dates, dateString)=>{
        this.props.dispatch({
            type: 'refuelList/updateState',
            payload: {
                startDate: dateString[0],
                endDate: dateString[1]
            }
        })
        this.props.dispatch({
            type: 'refuelList/getTableData'
        })
}
    render(){
        const t = this;
        const dispatch = t.props.dispatch;
        const { company, companyTree, carClassesCode, carClassesSelect, carCode, carCodeTree,
            startDate, endDate, tableData, currentPage, pageSize, totalItems,loading,detail,mapType,
            wkid, mapServer, detailLoading,setVisiblePoints} = t.props.refuelList;
        let carClassesOption = carClassesSelect.map((item,index)=>{
            return <Option value={item.code} key={item.code}>{item.text}</Option>
        })
        carClassesOption.unshift(<Option value="" key="0">全部</Option>);
        const modalProps={
            mapType,//地图类型
            wkid,//坐标系编号与mapServer的wkid
            mapServer,
            detail,
            detailLoading,
            setVisiblePoints
        }
        const columns=[{
            title:'作业单位',
            dataIndex:'companyName',
            key:'companyName',
            width:100
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
            title:'加油时间',
            dataIndex:'addOilDateTime',
            key:'addOilDateTime',
            width:100,
            render:(text)=>{
                return moment(text).format('YYYY-MM-DD')
            }
        },{
            title:'加油类型',
            dataIndex:'addTypeName',
            key:'addTypeName',
            width:50
        },{
            title:'加油地址',
            dataIndex:'addOilAddress',
            key:'addOilAddress',
            width:200
        },{
            title:'加油量(L)',
            dataIndex:'addOilMass',
            key:'addOilMass',
            width:50,
        },{
            title:'参考加油票号',
            dataIndex:'billNo',
            key:'billNo',
            width:50
        },{
            title:'操作',
            dataIndex:'operation',
            key:'operation',
            width:30,
            render:(text,record)=>{
                return <span>
                            <RefuelDetailModal {...modalProps} record={record} id={record.id} dispatch={dispatch}>
                                <a>查看</a>
                            </RefuelDetailModal>
                       </span>
            }
        }];

        const vProps = {
            columns,
            autoFit:true,
            loading,
            dataSource:tableData,
            rowKey:(record)=>record.id,
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
                        type: 'refuelList/updateState',
                        payload: {
                            currentPage: page,
                            pageSize,
                        }
                    })
                    dispatch({
                        type: 'refuelList/getTableData',
                    })
                },
                // pageSize 变化的回调
                onShowSizeChange(current, size) {
                    dispatch({
                        type: 'refuelList/updateState',
                        payload: {
                            currentPage: current,
                            pageSize: size,
                        }
                    })
                    dispatch({
                        type: 'refuelList/getTableData',
                    })
                },
                showTotal: total => `合计 ${total} 条`,
            }
        }
        //导出参数
        const exportProps = {
            downloadURL: 'http://222.92.212.126:9082/cloud/oil/api/np/v101/caraddoil/download.smvc',
            rowButton:false,
            getExportParams(exportType) {
                const common = {
                    carId:carCode,
                    carClassesCode,
                    companyId:company,
                    startTime:startDate,
                    endTime:endDate
                };
                switch (exportType) {
                    case 'page':
                        if (tableData.length == 0) {
                            message.warn('当前页没有数据');
                            return null;
                        }
                        return getBaicPostData({
                            ...common,
                            way:"2",
                            page:currentPage,
                            rows:pageSize
                        });
                    case 'all':
                        if (tableData.length == 0) {
                            message.warn('当前没有数据');
                            return null;
                        }
                        return getBaicPostData({
                            ...common,
                            way: "3",
                        });
                }
            }
        }
        return (
            <div className={styles.normal}>
               <VtxGrid
                    titles={[
                        '作业单位','车辆类型','车牌号','查询时间'
                    ]}
                    gridweight={[1,1,1,1]}
                    confirm={t.onQuery}
                    clear={t.onClear}
                >
                    <TreeSelect
                        required={false}
                        style={{width:'100%'}}
                        value={company}
                        treeData={companyTree}
                        treeDefaultExpandAll
                        showSearch
                        onChange={t.changeCompany}
                        treeNodeFilterProp="label"
                        dropdownStyle={{ maxHeight: '400px' }}
                    />
                    <Select
                        style={{width:'100%'}}
                        value={carClassesCode}
                        onChange={t.changeCarClass}
                    >
                        {carClassesOption}
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
                    />
                    <VtxRangePicker
                        value={[startDate, endDate]}
                        onChange={t.changeDate}
                        disabledDate={t.disabledDate}
                    />
                </VtxGrid>
                <div className={styles.buttonContainer}>
                    <VtxExport2 {...exportProps} />
                </div>
                <div className={styles.tableContainer}>
                    <VtxDatagrid {...vProps} />
                </div>
            </div>
        )
    }
}

function mapStateToProps(state) {
    return { refuelList: state.refuelList }
}
export default connect(mapStateToProps)(RefuelList)

