 /*地图弹窗*/
import React from 'react';
import { Modal, message, Button } from 'antd';
import {  VtxMap } from 'vtx-ui';
const { VtxOptMap } = VtxMap;
import { REFUEL_ICON } from '../../utils/refuelIcon';
import styles from './NewStationModal.less'

class LocateMapModal extends React.Component {
    constructor(props) {
        super(props);
        this.state={
            visible:false,
            longitude:'',
            latitude:'',
            pointId:'',
            mapCenter:[114.3,30.6],//默认武汉市经纬度
            setCenter:false,
            mapPoints:[],
            isDraw:false,
            isClearAll:false,
            mapRemove:[],
            isRemove:false,
        }
    }
    showModalHandler=()=>{
        const {checkType} = this.props;
        if(checkType==='edit'){
            const {longitude, latitude} = this.props;
            this.setState({
                longitude,
                latitude,
                mapRemove:[{
                    id:longitude+'',
                    type:'point',
                }],
                setCenter:true,
                mapCenter:[longitude,latitude],
                mapPoints:[{
                    id:longitude+'',
                    longitude,
                    latitude,
                    url:REFUEL_ICON.defaultMarker}],
                visible:true,
                isRemove:false
            })
            delay(1)
            this.setState({
                setCenter:false
            })
        }else{
            this.setState({
                isDraw:true,
                visible:true,
                isRemove:false
            })
        }
    }
    hideModalHandler=()=>{
        this.setState({
            visible:false,
            longitude: '',
            latitude: '',
            pointId: '',
            mapCenter: [114.3, 30.6],//默认武汉市经纬度
            setCenter: false,
            mapPoints: [],
            isDraw: false,
            isClearAll: false,
            isRemove: true,
        })
    }
    drawAgain=()=>{
        this.setState({
            isRemove:true,
            mapPoints:[],
            longitude:'',
            latitude:'',
            isDraw:true
        })
    }
    drawPoint=(obj)=>{
        this.setState({
            isDraw:false,
            longitude: obj.geometry.x,
            latitude: obj.geometry.y,
            mapRemove:[{
                id:obj.id,
                type:'draw'
            }],
            isRemove:false
        })
    }
    onOk=()=>{
        const {longitude,latitude} = this.state;
        if(!longitude||!latitude){
            message.error('请正确绘制加油站点位置')
        }else{
            this.props.finishDraw(longitude, latitude);
            this.hideModalHandler();
        }
    }
    render(){
        const {isDraw, longitude, latitude,setCenter,mapCenter,mapPoints,isClearAll,mapRemove,isRemove} = this.state;
        const {mapType, wkid,children} = this.props;
        const t = this;
        const mapProps={
            mapId:(new Date().getTime()+''),
            mapType,
            wkid,
            setCenter,
            mapCenter,
            mapPoints,
            isDraw,
            isClearAll,
            drawEnd:t.drawPoint,
            mapDraw:{
                geometryType:'point',
                parameter:{
                    url:REFUEL_ICON.defaultMarker,                   
                }
            },
            mapRemove,
            isRemove
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
                    width={600}
                    title={<center>绘制加油站位置</center>}
                    footer={[<Button key="back" size="large" onClick={t.drawAgain}>重绘</Button>,
                    <Button key="submit" type="primary" size="large" onClick={t.onOk}>
                        确定
                                </Button>,]}
                    mask={false}
                    style={{ top: 150 }}
                >
                    <div className={styles.map}>
                        <VtxOptMap
                            {...mapProps}
                            getMapInstance={(map) => { if (map) this.map = map }}
                        />
                    </div>
                </Modal>
            </span>
        )
    }
}
export default LocateMapModal;
function delay(time) {
    return new Promise((resolve) => {
        setTimeout(() => { resolve() }, time);
    })
}