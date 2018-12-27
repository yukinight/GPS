import React from 'react';
import {VtxMap} from 'vtx-ui';
import {deepEqual} from '../../utils/util';
import {GPS_ICON} from '../../utils/iconMap';
import {message} from 'antd';

class TrackMap extends React.Component{
    constructor(props){
        super();
        this.map = null;
        this.mapPlayer= null;
    }
    componentDidMount(){
        this.mapPlayer = new MapPlay({
            map:this.map,
            pointList: this.props.data.carPositions,
            speedRatio:this.props.data.carPlayCfg.speedRatio,
        });
    }
    componentWillUnmount(){
        this.mapPlayer.destroy();
    }
    shouldComponentUpdate(nextProps, nextState){
        if(deepEqual(this.props.data,nextProps.data) && deepEqual(this.state,nextState)){
            return false;
        }
        else{
            return true;
        }
    }
    componentWillReceiveProps(nextProps){
        let resetObj = {};
        // 如果播放进度条被手动重置，当前播放进度需要匹配
        if(nextProps.data.carPlayCfg.resetProgressFlag!=this.props.data.carPlayCfg.resetProgressFlag){
            let progressIndex = parseInt(nextProps.data.carPlayCfg.progress/100*nextProps.data.carPositions.length)-1;
            if(progressIndex<0)progressIndex=0;
            resetObj.pointIndex = progressIndex;
        }
        // 重置播放速度
        if(this.props.data.carPlayCfg.speedRatio!=nextProps.data.carPlayCfg.speedRatio){
            resetObj.speedRatio = nextProps.data.carPlayCfg.speedRatio;
        }
        // 点位列表重置
        if(!deepEqual(this.props.data.carPositions,nextProps.data.carPositions)){
            resetObj.pointList = nextProps.data.carPositions;
        }
        this.map.loadMapComplete && this.map.loadMapComplete.then(()=>{
            this.mapPlayer.resetCfg(resetObj);
        });
        
    }
    play(){
        const {carPositions,carPlayCfg} = this.props.data;
        const {updateM,tableScrollToIndex} = this.props;
        this.mapPlayer.play(function(nextIndex){
            tableScrollToIndex(nextIndex);
            updateM({
                carPlayCfg:{
                    progress:parseInt(100*(nextIndex+1)/carPositions.length)
                }
            });
            if(nextIndex>=carPositions.length-1){
                updateM({
                    carPlayCfg:{
                        isPlaying:false
                    }
                });
                message.info('轨迹播放结束')
            }
        });
    }
    stop(){
        this.mapPlayer.stop();
        this.props.updateM({
            carPlayCfg:{
                progress:0,
                isPlaying:false
            }
        });

    }
    pause(){
        this.mapPlayer.pause();
        this.props.updateM({
            carPlayCfg:{
                isPlaying:false
            }
        });
    }
    render(){
        const t = this;
        const {mapCfg} = t.props.data;
        return (
            <VtxMap getMapInstance={(ins)=>{if(ins)t.map=ins}} {...mapCfg}/>
        )
    }
}

export default TrackMap;


class MapPlay{
    constructor({map,pointList,speedRatio}){
        this.map = map;
        this.pointId = 'trackedPoint';
        this.lineId = 'trackLine';
        this.speed = 12;//点位速度，m/s
        this.speedRatio = speedRatio||60;//速度倍率
        this.playFrame = 60;//播放帧率
        this.pointList = pointList||[];//点位列表
        this.currentPlayIndex = null;//当前播放点位的序号
        this.supplementPoints = [];//补点列表
        this.currentSupplementIndex = null;//补点序号
        this.Timer = null;//播放控制定时器
    }
    // 同步实际数据到地图图元
    synDataInMap(){
        if(this.pointList.length==0 ){
            this.map.GM.isRepetition(this.pointId) && this.map.removeGraphic(this.pointId);
            this.map.GM.isRepetition(this.lineId) && this.map.removeGraphic(this.lineId);
        }
        else if(typeof(this.currentPlayIndex)=='number' && this.currentPlayIndex<this.pointList.length){
            // 画点
            const deg = this.currentPlayIndex+1<this.pointList.length?this.getIconAngle({
                x:this.pointList[this.currentPlayIndex].longitudeDone,
                y:this.pointList[this.currentPlayIndex].latitudeDone,
            },{
                x:this.pointList[this.currentPlayIndex+1].longitudeDone,
                y:this.pointList[this.currentPlayIndex+1].latitudeDone
            }):0;
            let currentPoint;
            if(this.supplementPoints.length>0){
                currentPoint = this.supplementPoints[this.currentSupplementIndex];
            }
            else{
                currentPoint = this.pointList[this.currentPlayIndex];
            }
            const pointObj = {
                id: this.pointId,
                latitude:currentPoint.latitudeDone,
                longitude:currentPoint.longitudeDone,
                canShowLabel:true,
                url:GPS_ICON.map.carOn,
                labelClass:'trackCarLabel',
                config:{
                    width:30,
                    height:30,            
                    markerContentX:-15,
                    markerContentY:-15,            
                    labelContent:currentPoint.carCode,
                    deg
                }
            }
            if(this.map.GM.isRepetition(this.pointId)){
                this.map.updatePoint([pointObj]);
            }
            else{
                this.map.addPoint([pointObj],'defined');
            }
            // 画线
            let paths = [];
            if(this.currentPlayIndex!==null){
                for(let i=0;i<=this.currentPlayIndex;i++){
                    paths.push([this.pointList[i].longitudeDone,this.pointList[i].latitudeDone])
                }
            }
            if(this.supplementPoints.length>0){
                for(let i=0;i<=this.currentSupplementIndex;i++){
                    paths.push([this.supplementPoints[i].longitudeDone,this.supplementPoints[i].latitudeDone])
                }
            }
            if(paths.length>1){
                const lineObj = {
                    id:this.lineId,
                    paths,
                    config:{
                        lineWidth:3,
                        color:'blue'
                    }
                }
                if(this.map.GM.isRepetition(this.lineId)){
                    this.map.updateLine([lineObj]);
                }
                else{
                    this.map.addLine([lineObj],'defined');
                }
            }
            else{
                this.map.removeGraphic(this.lineId);
            } 
        }
    }
    // 计算图标转动角度（仅适用于当前车辆图标，仅适用于中国区域）
    getIconAngle(start,end){
        const diff_x = end.x - start.x,
            diff_y = end.y - start.y;
        // 1,4象限夹脚计算
        const ag = 360*Math.atan(diff_y/diff_x)/(2*Math.PI);
        // 地图夹角偏转计算
        if(diff_x==0){
            if(diff_y>0){
                return -90;
            }
            else if(diff_y<0){
                return 90;
            }
            else{
                return 0;
            }
        }
        // 坐标系1,4象限
        else if(diff_x>0){
            return -ag;
        }
        // 坐标系2,3象限
        else{
            return 180 - ag;
        }
    }
    clearTimer(){
        if(this.Timer){
            clearTimeout(this.Timer);
            this.Timer = null;
        }
    }
    destroy(){
        this.clearTimer();
        this.map.removeGraphic(this.pointId);
        this.map.removeGraphic(this.lineId);
        this.map = null;
    }
    play(moveFunc){
        this.clearTimer();
        if(this.pointList.length==0)return;
       
        const nextIndex = this.currentPlayIndex===null?0:this.currentPlayIndex+1;
        // 当前处于补点播放
        if(this.supplementPoints.length>0){
            if(this.currentSupplementIndex>=this.supplementPoints.length-1){
                this.supplementPoints = [];
                this.currentSupplementIndex = null;
                this.currentPlayIndex = nextIndex;
                moveFunc(this.currentPlayIndex)
            }
            else{
                this.currentSupplementIndex++;
            }
            this.synDataInMap();
            this.Timer = setTimeout(()=>{
                this.play(moveFunc);
            },1000/this.playFrame);
        }
        // 正常点位播放
        else{
            // 播放初始化
            if(this.currentPlayIndex===null){
                this.currentPlayIndex = 0;
                this.synDataInMap();
                moveFunc(0);
                this.Timer = setTimeout(()=>{
                    this.play(moveFunc);
                },1000/this.playFrame)
            }
            else if(nextIndex < this.pointList.length){
                const {longitudeDone:currentLng, latitudeDone:currentLat} = this.pointList[this.currentPlayIndex];
                const {longitudeDone:nextLng, latitudeDone:nextLat} = this.pointList[nextIndex];
                const runTime = this.map.calculateDistance([
                    [currentLng,currentLat],
                    [nextLng,nextLat]
                ])/(this.speed*this.speedRatio);
                // 不需要补点
                if(runTime<1/this.playFrame){
                    this.currentPlayIndex = nextIndex;
                    this.synDataInMap();
                    moveFunc(this.currentPlayIndex);
                    this.Timer = setTimeout(()=>{
                        this.play(moveFunc);
                    },runTime*1000<5?5:runTime*1000)
                }
                // 需要补点
                else{
                    const supplementNum = parseInt(runTime/(1/this.playFrame));
                    const lon_spacing = (nextLng - currentLng)/supplementNum;
                    const lat_spacing = (nextLat - currentLat)/supplementNum;
                    let supplementPoints = [];
                    for(let i=1;i<=supplementNum;i++){
                        supplementPoints.push({
                            longitudeDone:currentLng+lon_spacing*i,
                            latitudeDone:currentLat+lat_spacing*i,
                            carCode:this.pointList[this.currentPlayIndex].carCode
                        });
                    }
                    this.supplementPoints = supplementPoints;
                    this.currentSupplementIndex = 0;
                    this.synDataInMap();
                    this.Timer = setTimeout(()=>{
                        this.play(moveFunc);
                    },1000/this.playFrame)
                }
            }   
        }
    }
    pause(){
        this.clearTimer();
        // if(this.supplementPoints.length!=0){
        //     this.currentPlayIndex++;
        //     this.supplementPoints = [];
        //     this.currentSupplementIndex = null;
        //     this.synDataInMap();
        // }
    }
    stop(){
        this.clearTimer();
        this.currentPlayIndex = 0;
        this.supplementPoints = [];
        this.currentSupplementIndex = null;
        this.synDataInMap();

    }
    resetCfg({pointIndex,pointList,speedRatio}){
        let needRedraw = false;
        if(typeof pointIndex=='number' && pointIndex!==this.currentPlayIndex){
            this.currentPlayIndex = pointIndex;
            this.supplementPoints = [];
            this.currentSupplementIndex = null;
            needRedraw = true;
        }
        if(pointList && !deepEqual(pointList,this.pointList)){
            this.pointList = pointList;
            needRedraw = true;
        }
        if(speedRatio){
            this.speedRatio = speedRatio;
        }
        if(needRedraw){
            this.synDataInMap();
        }
    }

}