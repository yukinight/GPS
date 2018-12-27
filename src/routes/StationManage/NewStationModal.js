/*编辑加油站弹窗 */
import React from 'react';
import {  Modal, Input, message,Button } from 'antd';
import { VtxModalList,VtxMap } from 'vtx-ui';
const {TextArea} = Input;
const { VtxOptMap } = VtxMap;
import { REFUEL_ICON } from '../../utils/refuelIcon';
import LocateMapModal from './LocateMapModal';
import styles from './NewStationModal.less'

class NewStationModal extends React.Component {
    constructor(props) {
        super(props);
        this.lis = null;
        this.state = {
            visible: false,
            code: '',
            name: '',
            address: '',
            longitudeDone: '',
            latitudeDone: '',
            setShowCenter:false,//查看弹框展示地图的setCenter
            showCenter: [],//查看弹框展示地图的中心点
            showPoint:[],
        }
    }
    showModalHandler=()=>{
        const {checkType} = this.props;
        const { code, name, address, longitudeDone, latitudeDone,id } = this.props.record||{};
        if(checkType!=='new'){
            this.setState({
                code,
                name,
                address,
                longitudeDone,
                latitudeDone,

            })
        }
        if(checkType==='new'){
            this.setState({
                setLocateCenter:true,
                locateCenter:[114.3,30.6]//中心点设为武汉
            });
            delay(1)
            this.setState({
                setLocateCenter: false,
            })
        }else if(checkType==='edit'){
            this.setState({
                setLocateCenter: true,
                setLocateVisbile:true,
                locateCenter: [longitudeDone,latitudeDone],//中心点设为定位点
                locatePoint:[{//标记设为定位点
                    id,
                    longitude:latitudeDone,
                    latitude:latitudeDone,
                    url: REFUEL_ICON.defaultMarker
                }]
            });
            delay(1)
            this.setState({
                setLocateCenter: false,
                setLocateVisbile: false,
            })
        }else{
            this.setState({
                setShowCenter:true,
                setShowVisible:true,
                showCenter:[longitudeDone,latitudeDone],
                showPoint:[{
                    id,
                    longitude: longitudeDone,
                    latitude: latitudeDone,
                    url: REFUEL_ICON.defaultMarker
                }]
            })
            delay(1)
            this.setState({
                setShowCenter: false,
                setShowVisible: false,
            })
        }
        this.setState({
            visible:true
        })
    }
    clearDetail=()=>{
        this.setState({
            code: '',
            name: '',
            address: '',
            longitudeDone: '',
            latitudeDone: '',
        })
    }
    changeCode=(e)=>{
        this.setState({
            code:e.target.value
        })
        
    }
    //验重
    checkForm=()=>{
        const code = this.state.code
        if (this.props.checkType === 'new') {
            this.props.dispatch({
                type: 'stationManage/checkForm',
                payload: {
                    code,
                }
            })
        }else{
            this.props.dispatch({
                type: 'stationManage/checkForm',
                payload: {
                    code,
                    id:this.props.record.id
                }
            })
        }
    }
    hideModalHandler = () => {
        this.setState({
            visible: false,
        })
        this.lis.clear();
        this.clearDetail()
    }

    handleSubmit=()=>{
        const {checkType,dispatch} = this.props
        const {code, name, address,longitudeDone, latitudeDone} = this.state
        this.lis.submit().then(data => {
            if (data) {
                this.hideModalHandler();
                if(checkType==='edit'){
                    dispatch({
                        type:'stationManage/update',
                        payload:{
                            id:this.props.record.id,
                            code,
                            name,
                            address,
                            longitudeDone,
                            latitudeDone
                        }
                    })
                }else{
                    dispatch({
                        type: 'stationManage/add',
                        payload: {
                            code,
                            name,
                            address,
                            longitudeDone,
                            latitudeDone
                        }
                    })
                }
            }else {

            }
        })
    }
    finishDraw=(longitude,latitude)=>{
        this.setState({
            longitudeDone:longitude,
            latitudeDone:latitude,
        })
    }
    render(){
        const t = this;        
        const { children, checkType, mapType, wkid, mapServer, minZoom, maxZoom,} = t.props;
        const { code, name, address, latitudeDone, longitudeDone, setShowCenter,
            showCenter,showPoint
        } = t.state;
        const isDetail = checkType==='view';

        const modalTitle={
            'edit':'加油站管理 > 修改',
            'view':'加油站管理 > 查看',
            'new':'加油站管理 > 新增'
        }
        const modalFooter={
            'edit': [<Button key="submit" type="primary" size="large" onClick={t.handleSubmit}>
                保存
            </Button>,],
            'view':null,
            'new': [<Button key="back" size="large" onClick={t.clearDetail}>清空</Button>,
                <Button key="submit" type="primary" size="large" onClick={t.handleSubmit}>
                    保存
            </Button>,]
        }
        const modalProps = {
            title: modalTitle[checkType],
            footer:modalFooter[checkType],
            bodyStyle:{ background: '#fbfbfb' }
        };
        //查看地图参数
        const showMapProps = {
            mapId: this.props.record?this.props.record.id: (new Date().getTime())+'',
            wkid,
            mapType,
            mapServer, minZoom, maxZoom,
            mapCenter:showCenter,
            setCenter:setShowCenter,
            mapPoints:showPoint,
        }
        //定位地图参数
        const locateMapProps={
            mapType,
            wkid,
            longitude:longitudeDone,
            latitude:latitudeDone,
            checkType,
            finishDraw:t.finishDraw
        }
        return(
            <span>
                <span onClick={this.showModalHandler}>
                    {children}
                </span>
                <Modal
                    visible={t.state.visible}
                    onCancel={t.hideModalHandler}
                    width={650}
                    maskClosable={false}
                    {...modalProps}
                >
                    <VtxModalList
                        ref={(lis) => { this.lis = lis }}
                        isRequired={true}
                        visible={true}
                    >
                        {/*编号*/}
                        {
                            isDetail?
                                <div
                                    data-modallist={{
                                        layout: { width: 60, name: '编号', type: 'text', require: false },
                                    }}
                                >
                                {code}
                                </div>
                            :
                            <Input
                                value={code}
                                onChange={t.changeCode}
                                onBlur={t.checkForm}
                                data-modallist={{
                                    layout:{width:60,name:'编号',require:true,comType:'input'},
                                    regexp:{
                                        value:code,
                                    }
                                }}
                            />
                        }
                        {/*名称*/}
                        {
                            isDetail ?
                                <div
                                    data-modallist={{
                                        layout: { width: 60, name: '名称', type: 'text', require: false },
                                    }}
                                >
                                    {name}
                                </div>
                                :
                                <Input
                                    value={name}
                                    onChange={(e) => { t.setState({name:e.target.value}) }}
                                    data-modallist={{
                                        layout: { width: 60, name: '名称', require: true, comType: 'input' },
                                        regexp: {
                                            value: name,
                                        }
                                    }}
                                />
                        }
                        {/*地址*/}
                        {
                            isDetail ?
                                <div
                                    data-modallist={{
                                        layout: { width: 100, name: '地址', type: 'text', require: false },
                                    }}
                                >
                                    {address}
                                </div>
                                :
                                <TextArea
                                    style={{width:'100%'}}
                                    value={address}
                                    autosize={{minRows:2,maxRows:6}}
                                    onChange={(e) => { t.setState({address:e.target.value}) }}
                                    data-modallist={{
                                        layout: { width: 100, name: '地址', require: true, comType: 'input' },
                                        regexp: {
                                            value: address,
                                        }
                                    }}
                                />
                        }
                        {/*经度*/}
                        {
                            isDetail ?
                                <div
                                    data-modallist={{
                                        layout: { width: 60, name: '经度', type: 'text', require: false },
                                    }}
                                >
                                    {longitudeDone}
                                </div>
                                :
                                <Input
                                    value={longitudeDone}
                                    disabled
                                    data-modallist={{
                                        layout: { width: 60, name: '经度', require: true, comType: 'input' },
                                        regexp: {
                                            value: longitudeDone,
                                        }
                                    }}
                                />
                        }
                        {/*纬度*/}
                        {
                            isDetail ?
                                <div
                                    data-modallist={{
                                        layout: { width: 60, name: '纬度', type: 'text', require: false },
                                    }}
                                >
                                    {latitudeDone}
                                </div>
                                :
                                <Input
                                    value={latitudeDone}
                                    disabled
                                    data-modallist={{
                                        layout: { width: 60, name: '纬度', require: true, comType: 'input' },
                                        regexp: {
                                            value: latitudeDone,
                                        }
                                    }}
                                />
                        }
                        {
                            isDetail?
                                ''
                            :
                            <LocateMapModal 
                                    {...locateMapProps}
                                    data-modallist={{
                                        layout: { width: 10 }
                                    }}>
                                <Button type='primary'
                                        style={{ marginLeft: '10px' }}
                                >定位</Button>
                            </LocateMapModal>
                        }
                    </VtxModalList>
                    {
                        !isDetail?''
                        :
                            <div className={styles.map}>
                                <VtxOptMap
                                    {...showMapProps}
                                    getMapInstance={(map) => { if (map) this.map = map }}
                                />
                            </div>
                    }
                    
                </Modal>
            </span>
        )
    }
}
export default NewStationModal;
function delay(time) {
    return new Promise((resolve) => {
        setTimeout(() => { resolve() }, time);
    })
}