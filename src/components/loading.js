import React from 'react';
import style from './loading.less';
import {GPS_ICON} from '../utils/iconMap';

export default function(){
    return (
        
        <div className={style.cover_layer}>
            <img src={GPS_ICON.loading} className={style.loading_img} />
        </div>
    )
}