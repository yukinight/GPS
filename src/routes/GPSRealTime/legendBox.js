import React from 'react';
import {Icon} from 'antd';
import {GPS_ICON} from '../../utils/iconMap';

import style from './legendBox.less';

export default function(props){
    return (
        <div className={style.legendCt}>
            <div className={style.head}>
                图例
                <Icon type="close" className={style.closeIcon} onClick={props.closeLegendBox}/>
            </div>
            <ul>
                <li>
                    <img src={GPS_ICON.map.carOn}/>
                    <div>行驶在线</div>
                </li>
                <li>
                    <img src={GPS_ICON.map.carStop}/>
                    <div>停车在线</div>
                </li>
                <li>
                    <img src={GPS_ICON.map.carOff}/>
                    <div>离线</div>
                </li>
                {/* <li>
                    <img src={GPS_ICON.map.carAlarm}/>
                    <div>报警</div>
                </li> */}
            </ul>
            <ul style={{marginTop:'10px'}}>
                {
                    props.iconList.map((icon,index)=><li key={index}>
                        <img src={icon.iconUrl}/>
                        <div>{icon.name}</div>
                    </li>)
                }
                
            </ul>
        </div>
    )
}