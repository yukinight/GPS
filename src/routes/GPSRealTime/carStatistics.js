import React from 'react';
import ReactEcharts from 'echarts-for-react';
import {Icon} from 'antd';
import style from './carStatistics.less';

export default function (props) {
    
    const {carStatusMap,companyMap,carTypeMap} = props;
    const carStatusData = Object.keys(carStatusMap).map(key=>({name:key,value:carStatusMap[key]}));
    const carTypeData = Object.keys(carTypeMap).map(key=>({name:key,value:carTypeMap[key]}));
    const carCompanyData = Object.keys(companyMap).map(key=>({name:key,value:companyMap[key]}));
    
    const option = {
        title : {
            text: '车辆统计详情',
            x:'center'
        },
        tooltip : {
            trigger: 'item',
            formatter: "{a} <br/>{b} : {c} ({d}%)"
        },
        
        series : [
            {
                name: '车辆类型统计',
                type: 'pie',
                radius : '60px',
                center: ['16%', '50%'],
                data:carTypeData,
                label: {
                    normal: {
                        show: false,
                        position: 'inside'
                    },
                    emphasis: {
                        show: true,
                        textStyle: {
                            fontSize: '20',
                            fontWeight: 'bold'
                        }
                    }
                },
                labelLine: {
                    normal: {
                        show: false
                    }
                },
            },
            {
                name: '车辆状态统计',
                type: 'pie',
                radius : '60px',
                center: ['49%', '50%'],
                data:carStatusData,
                label: {
                    normal: {
                        show: false,
                        position: 'inside'
                    },
                    emphasis: {
                        show: true,
                        textStyle: {
                            fontSize: '20',
                            fontWeight: 'bold'
                        }
                    }
                },
                labelLine: {
                    normal: {
                        show: false
                    }
                },
            },
            {
                name: '车辆单位统计',
                type: 'pie',
                radius : '60px',
                center: ['82%', '50%'],
                data:carCompanyData,
                label: {
                    normal: {
                        show: false,
                        position: 'inside'
                    },
                    emphasis: {
                        show: true,
                        textStyle: {
                            fontSize: '20',
                            fontWeight: 'bold'
                        }
                    }
                },
                labelLine: {
                    normal: {
                        show: false
                    }
                },
            }
        ],
    };
    return (
        <div className={style.outct}>
            <div className={style.close} onClick={props.closeCarStatisticsChart}>
                <Icon type="close" />
            </div>
            <div className={style.subNameBar}>
                <div>车辆类型统计</div>
                <div>车辆状态统计</div>
                <div>车辆单位统计</div>
            </div>
            
            <ReactEcharts
                option={option} 
                notMerge={true}
                lazyUpdate={true}
                style={{height:'200px'}}
            />
        </div>
    )
}