import React from 'react';
import {VtxMap} from 'vtx-ui';
import {deepEqual} from '../../utils/util';
import {GPS_ICON} from '../../utils/iconMap';
import {message} from 'antd';

class TrackMap extends React.Component{
    constructor(props){
        super();
        this.state = {
            speed:20,//默认20m/s的车速
            frames:60,//刷新帧数
            currentPlayIndex:0,//当前播放的点位序列号
            supplementPoints:[],//两点之间的补点
            currentSupplementIndex:0,//当前播放的补点序列号
        }
        this.map = null;
        this.playTimer = null;
    }
    componentDidMount(){

    }
    componentWillUnmount(){
        if(this.playTimer)clearTimeout(this.playTimer);
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
        // 如果播放进度条被手动重置，当前播放进度需要匹配
        if(nextProps.data.carPlayCfg.resetProgressFlag!=this.props.data.carPlayCfg.resetProgressFlag){
            let progressIndex = parseInt(nextProps.data.carPlayCfg.progress/100*nextProps.data.carPositions.length)-1;
            if(progressIndex<0)progressIndex=0;
            if(progressIndex!=this.state.currentPlayIndex){
                this.setState({
                    currentPlayIndex:progressIndex,
                    supplementPoints:[],
                    currentSupplementIndex:0,
                })
            }
        }
    }
    play(){
        const {carPositions,carPlayCfg} = this.props.data;
        const {updateM,tableScrollToIndex} = this.props;
        const nextIndex = this.state.currentPlayIndex+1;
        if(this.playTimer){
            clearTimeout(this.playTimer);
            this.playTimer = null;
        }
        //判断是否处于补点的移动
        if(this.state.supplementPoints.length>0){
            // 还有补点需要跑
            if(this.state.currentSupplementIndex+1<this.state.supplementPoints.length){
                this.setState({
                    currentSupplementIndex:this.state.currentSupplementIndex+1
                },()=>{
                    this.playTimer = setTimeout(()=>{
                        this.play();
                    },1000/this.state.frames);
                })
            }
            // 补点已经跑完
            else{
                this.setState({
                    currentPlayIndex:nextIndex,
                    supplementPoints:[],
                    currentSupplementIndex:0
                },()=>{
                    tableScrollToIndex(nextIndex);
                    // 车速为0，停车2s
                    this.playTimer = setTimeout(()=>{
                        this.play();
                    },carPositions[nextIndex].speed==0?2000:1000/this.state.frames);
                });
                updateM({
                    carPlayCfg:{
                        progress:parseInt(100*(nextIndex+1)/carPositions.length)
                    }
                });
                
            }
            
        }
        // 存在下个点
        else if(nextIndex < carPositions.length){
            const currentPoint = carPositions[this.state.currentPlayIndex];
            const nextPoint = carPositions[nextIndex];
            // 从上一个点到下一个点移动所需要的时间
            const runTime = this.map.calculateDistance([[currentPoint.longitudeDone,currentPoint.latitudeDone],[nextPoint.longitudeDone,nextPoint.latitudeDone]])/(this.state.speed*carPlayCfg.speedRatio);
            // 路径很短，直接跳跃至该点
            if(runTime<1/this.state.frames){
                this.setState({
                    currentPlayIndex:nextIndex
                },()=>{
                    // 车速为0，停车2s
                    this.playTimer = setTimeout(()=>{
                        this.play();
                    },nextPoint.speed==0?2000:runTime*1000);
                    tableScrollToIndex(nextIndex);
                    updateM({
                        carPlayCfg:{
                            progress:parseInt(100*(nextIndex+1)/carPositions.length)
                        }
                    });
                });
                
            }
            else{
                // 两点之间需要补充的点位
                const supplementNum = parseInt(runTime/(1/this.state.frames));
                const lon_spacing = (nextPoint.longitudeDone - currentPoint.longitudeDone)/supplementNum;
                const lat_spacing = (nextPoint.latitudeDone - currentPoint.latitudeDone)/supplementNum;
                let supplementPoints = [];
                for(let i=1;i<=supplementNum;i++){
                    supplementPoints.push([currentPoint.longitudeDone+lon_spacing*i,currentPoint.latitudeDone+lat_spacing*i]);
                }
                this.setState({
                    supplementPoints,
                    currentSupplementIndex:0
                },()=>{
                    this.playTimer = setTimeout(()=>{
                        this.play();
                    },1000/this.state.frames);
                });
            }
        }
        // 最后一个点停止播放
        else{
            updateM({
                carPlayCfg:{
                    isPlaying:false
                }
            });
            message.info('轨迹播放结束')
        }
    }
    stop(){
        if(this.playTimer){
            clearTimeout(this.playTimer);
            this.playTimer = null;
        }
        this.setState({
            currentPlayIndex:0,
            supplementPoints:[],
            currentSupplementIndex:0,
        })
        this.props.updateM({
            carPlayCfg:{
                progress:0,
                isPlaying:false
            }
        });

    }
    pause(){
        if(this.playTimer){
            clearTimeout(this.playTimer);
            this.playTimer = null;
        }
        this.props.updateM({
            carPlayCfg:{
                isPlaying:false
            }
        });
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
    render(){
        const t = this;
        const {mapCfg,carPositions,carPlayCfg} = t.props.data;
        const mapProps = {
            ...mapCfg,
        }
        if(carPositions.length>0 && carPositions.length>t.state.currentPlayIndex){
            const currentTrackedCar = carPositions[t.state.currentPlayIndex];
            let trackPoint;
            // 旋转角度
            const deg = carPositions.length==t.state.currentPlayIndex+1 ?0:t.getIconAngle(
                {x:carPositions[t.state.currentPlayIndex].longitudeDone,y:carPositions[t.state.currentPlayIndex].latitudeDone},
                {x:carPositions[t.state.currentPlayIndex+1].longitudeDone,y:carPositions[t.state.currentPlayIndex+1].latitudeDone}
            );
            const carLabel = currentTrackedCar.speed==0?(
                currentTrackedCar.carStatus=='点火'?'停车在线':'熄火'
            ):currentTrackedCar.carCode;
            // 显示补点
            if(this.state.supplementPoints.length>0){
                trackPoint = {
                    id:'trackedCar',
                    latitude:this.state.supplementPoints[this.state.currentSupplementIndex][1],
                    longitude:this.state.supplementPoints[this.state.currentSupplementIndex][0],
                    canShowLabel:true,
                    url:GPS_ICON.map.carOn,
                    labelClass:'trackCarLabel',
                    config:{
                        width:30,
                        height:30,
                        markerContentX:-15,
                        markerContentY:-15,
                        labelContent:carLabel,
                        deg,
                    }
                }
            }
            // 显示当前点位
            else{
                trackPoint = {
                    id:'trackedCar',
                    latitude:currentTrackedCar.latitudeDone,
                    longitude:currentTrackedCar.longitudeDone,
                    canShowLabel:true,
                    url:GPS_ICON.map.carOn,
                    labelClass:currentTrackedCar.speed==0?'stopCarLabel':'trackCarLabel',
                    config:{
                        width:30,
                        height:30,            
                        markerContentX:-15,
                        markerContentY:-15,            
                        labelContent:carLabel,
                        deg,
                    }
                }
            }
            const trackLine = {
                id:'trackedLine',
                paths:[
                    ...carPositions.slice(0,t.state.currentPlayIndex+1).map(item=>[item.longitudeDone,item.latitudeDone]),
                    ...this.state.supplementPoints.slice(0,this.state.currentSupplementIndex+1)
                ],
                config:{
                    lineWidth:3,
                    color:'red'
                }
            }
            // 轨迹播放时，地图中心点跟随变动
            if(carPlayCfg.isPlaying){
                if(this.state.supplementPoints.length>0){
                    mapProps.mapCenter = this.state.supplementPoints[this.state.currentSupplementIndex];
                }
                else{
                    mapProps.mapCenter = [carPositions[t.state.currentPlayIndex].longitudeDone,carPositions[t.state.currentPlayIndex].latitudeDone];
                }
                
                mapProps.setCenter = true;
            }
            mapProps.mapPoints = mapProps.mapPoints?[...mapProps.mapPoints,trackPoint]:[trackPoint]
            // 播放到第二个点时，开始画播放轨迹
            if(t.state.currentPlayIndex){
                mapProps.mapLines = mapProps.mapLines?[...mapProps.mapLines,trackLine]:[trackLine];
            }
        }
        return (
            <VtxMap getMapInstance={(ins)=>{if(ins)t.map=ins}} {...mapProps}/>
        )
    }
}

export default TrackMap;