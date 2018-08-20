import React from 'react';
import {Slider,Button,Icon} from 'antd';
import style from './carPlayControl.less';
import {getExportHistoryDataURL} from '../../services/GPSHistoryIFS';

export default class CarPlayControl extends React.Component{
    constructor(props){
        super();
        this.state = {
            folded:false,//是否折叠面板
        }
    }
    render(){
        const {speedRatio,progress,isPlaying,resetProgressFlag,playable,splitTimes,
        sumStart,sumEnd,carId,selectedSplitTimeIndex} = this.props.data;
        const {updateM,play,pause,stop,switchTimeSlot} = this.props;

        return (
            <div className={style.ct}>
                <div className={style.foldBar} onClick={()=>{
                    this.setState({
                        folded:!this.state.folded
                    })
                }}>
                    <span>分段轨迹</span>
                    (两段轨迹间，车辆停车时间超过5分钟)
                    <div className={style.toggleIcon}>
                        {
                            this.state.folded?<Icon type="down" />:<Icon type="up" />
                        }
                    </div>
                </div>
                {
                    this.state.folded?null
                    :[
                        <div className={style.barct} key={'playPanel'}>
                            <div className={style.singleBar}>
                                <div className={style.barLabel}>播放速度:</div>
                                <Slider value={speedRatio} min={1} max={20} marks={{
                                    1:'1x',
                                    20:'20x',
                                    [speedRatio]:`${speedRatio}x`
                                }} onChange={(val)=>{
                                    updateM({
                                        carPlayCfg:{
                                            speedRatio:val
                                        }
                                    })
                                }}/>
                            </div>
                            <div className={style.singleBar}>
                                <div className={style.barLabel}>播放进度:</div>
                                <Slider  value={progress} marks={{
                                    0:'0%',
                                    100:'100%',
                                    [progress]:`${progress}%`
                                }} onChange={(val)=>{
                                    updateM({
                                        carPlayCfg:{
                                            progress:val,
                                            resetProgressFlag:resetProgressFlag+1
                                        }
                                    })
                                }}/>
                            </div>
                            
                            <div className={style.btArea}>
                                {
                                    isPlaying?<div>
                                        <Button onClick={pause}><Icon type="pause-circle-o" />暂停</Button>
                                        <Button onClick={stop} type="danger">停止</Button>
                                    </div>
                                    :<Button onClick={play} type="primary" disabled={!playable}><Icon type="play-circle-o" />播放轨迹</Button>
                                }
                            </div>
                        </div>,
                        <div className={style.sectionCt} key={'timeSlotPanel'}>
                            <div className={style.totalRow}>
                                <ul className={style.row} onClick={()=>{
                                    switchTimeSlot(null);
                                }}>
                                    <li>汇总</li>
                                    <li>{sumStart} </li>
                                    <li>{sumEnd} </li>
                                    <li>
                                        {
                                            sumStart&&sumEnd? <a target='_blank' 
                                                href={getExportHistoryDataURL({carId,
                                                    endTime:sumEnd,
                                                    startTime:sumStart})
                                                }><Icon type="export" /></a>
                                            :' '
                                        }
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <ul className={style.row}>
                                    <li> </li>
                                    <li>开始时间</li>
                                    <li>结束时间</li>
                                    <li>导出数据</li>
                                </ul>
                            </div>
                            <div className={style.dataSec}>
                                {
                                    splitTimes.map((item,index)=>{
                                        return (
                                            <ul className={style.row} key={index} 
                                            style={index===selectedSplitTimeIndex?{backgroundColor:'lightblue'}:{}}
                                            onClick={()=>{
                                                switchTimeSlot(index);
                                            }}>
                                                <li>{index+1}</li>
                                                <li>{item.startTime}</li>
                                                <li>{item.endTime}</li>
                                                <li>
                                                    <a target='_blank' onClick={(e)=>{e.stopPropagation();}}
                                                    href={getExportHistoryDataURL({carId,
                                                        endTime:item.endTime,
                                                        startTime:item.startTime})
                                                    }>
                                                        <Icon type="export" />
                                                    </a>
                                                </li>
                                            </ul>
                                        )
                                    })
                                }    
                            </div>
                        </div>
                    ]
                }
                
            </div>
        )
    }
}