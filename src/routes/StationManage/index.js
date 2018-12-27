import React from 'react';
import { connect } from 'dva';
import moment from 'moment';
import { Input,  message,Select,Button,Popconfirm,Modal} from 'antd';
import { VtxGrid, VtxDatagrid } from 'vtx-ui';
import styles from './index.less'
import NewStationModal from './NewStationModal';
const Option = Select.Option;
const confirm = Modal.confirm;
class StationManage extends React.Component {
    constructor(props) {
        super(props)
    }
    componentDidMount = () => {
        const { dispatch } = this.props;
        dispatch({ type: 'common/getTenantInfo' }).then(() => {
            dispatch({ type: 'stationManage/setMapCfg' });
        })
    }
    onQuery = () => {
        this.props.dispatch({
            type: 'stationManage/updateState',
            payload: {
                currentPage: 1,
                pageSize: 10,
                selectedRowKeys:[]
            }
        })
        this.props.dispatch({
            type: 'stationManage/getTableData'
        })
    }
    onClear = () => {
        this.props.dispatch({
            type: 'stationManage/updateState',
            payload: {
                name:'',
                currentPage: 1,
                pageSize: 10,
                selectedRowKeys: []
            }
        })
        this.props.dispatch({
            type: 'stationManage/getTableData'
        })
    }
    // 批量删除
    deleteItems = () => {
        const {selectedRowKeys} = this.props.stationManage
        const t = this;
        if (selectedRowKeys.length > 0) {
            confirm({
                title: `确认删除选中的${selectedRowKeys.length}条数据？`,
                onOk() {
                    const ids = selectedRowKeys.join(',');
                    t.onDelete(ids);
                },
            });
        } else {
            message.warning('请选取需要删除的行');
        }
    };
    //删除单个
    onDelete = (id) => {
        this.props.dispatch({
            type: 'stationManage/delete',
            payload: {
                ids:id
            }
        })
    }
    changeName=(e)=>{
        this.props.dispatch({
            type: 'stationManage/updateState',
            payload: {
                name: e.target.value,
            }
        })
    }
    render(){
        const t = this;
        const { name, tableData, currentPage, pageSize, totalItems, loading,
              setCenter,selectedRowKeys} = t.props.stationManage;
        const { mapType, mapServer, minZoom, maxZoom, wkid, } = t.props.common
        const dispatch=t.props.dispatch;
        const modalProps={
            mapType,//地图类型
             mapServer, minZoom, maxZoom,
            wkid,//坐标系编号与mapServer的wkid
        };
        const columns = [{
            title:'编号',
            dataIndex:'code',
            key:'code',
            width:100
        },{
            title:'名称',
            dataIndex:'name',
            key:'name',
            width:100
        },{
            title:'地址',
            dataIndex:'address',
            key:'address',
            width:100
        },{
            title:'操作',
            dataIndex:'operation',
            key:'operation',
            width:100,
            render:(text,record)=>(
                <span>
                    <NewStationModal checkType='view' record={record} dispatch={dispatch} {...modalProps}>
                        <a>查看</a>
                    </NewStationModal>
                    <span className='ant-divider' />
                    <NewStationModal checkType='edit' record={record} dispatch={dispatch} {...modalProps}>
                        <a>修改</a>
                    </NewStationModal>
                    <span className='ant-divider' />
                    <Popconfirm
                        title="确定删除吗？"
                        okText="确定"
                        cancelText="取消"
                        onConfirm={this.onDelete.bind(null, record.id)}
                    >
                    <a>删除</a>
                    </Popconfirm>
                </span>
            )
        },];
        const vProps={
            columns,
            autoFit: true,
            loading,
            dataSource: tableData,
            rowKey: (record) => record.id,
            rowSelection: {
                type: 'checkbox',
                selectedRowKeys,
                onChange(currentSelectedRowKeys) {
                    t.props.dispatch({
                        type: 'stationManage/updateState', payload: {
                            selectedRowKeys: currentSelectedRowKeys
                        }
                    })
                }
            },
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
                        type: 'stationManage/updateState',
                        payload: {
                            currentPage: page,
                            pageSize,
                            selectedRowKeys: [],
                        }
                    })
                    dispatch({
                        type: 'stationManage/getTableData',
                    })
                },
                // pageSize 变化的回调
                onShowSizeChange(current, size) {
                    dispatch({
                        type: 'stationManage/updateState',
                        payload: {
                            currentPage: current,
                            pageSize: size,
                            selectedRowKeys: [],
                        }
                    })
                    dispatch({
                        type: 'stationManage/getTableData',
                    })
                },
                showTotal: total => `合计 ${total} 条`,
            }
        }
        return (
            <div className={styles.normal}>
                <VtxGrid
                    titles={[
                        '名称'
                    ]}
                    gridweight={[1]}
                    confirm={t.onQuery}
                    clear={t.onClear}
                >
                    <Input
                        value={name}
                        onChange={t.changeName}
                    />
                </VtxGrid>
                <div className={styles.buttonContainer}>
                    <NewStationModal checkType='new' dispatch={dispatch} {...modalProps}>
                        <Button className={styles.button} icon='file-add'>新增</Button>
                    </NewStationModal>
                    <Button icon='delete' onClick={t.deleteItems}>删除</Button>
                </div>
                <div className={styles.tableContainer}>
                    <VtxDatagrid {...vProps} />
                </div>
            </div>
        )
    }
}
function mapStateToProps(state) {
    return { stationManage: state.stationManage, common: state.common, }
}
export default connect(mapStateToProps)(StationManage)