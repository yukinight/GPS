import React from 'react';
import style from './toolBox.less';
import st2 from './index.less';
import {Icon, Button, Dropdown, Menu} from 'antd';
import TimeBox from '../../components/timeBox';
import {deepEqual} from '../../utils/util';

class ToolBox extends React.Component{
    constructor(props){
        super();
    }
    // shouldComponentUpdate(nextProps, nextState){
    //     if(deepEqual(this.props.data,nextProps.data)){
    //         return false;
    //     }
    //     else{
    //         return true;
    //     }
    // }
    render(){
        const t = this;
        const {toolboxCfg} = this.props.data;
        const {menuSelect} = this.props;
        return (
            <div className={`${style.toolBox} ${st2.toolArea}`}>
                <div className={style.timebox}><TimeBox/></div>
                {
                    toolboxCfg.map((item,index)=>(<div key={item.name} className={style.menu}>
                        <Dropdown overlay={genMenu({menuIndex:index,options:item.children,menuSelect})} placement="bottomCenter">
                            <Button>
                                {item.name}
                                <Icon type="down"/>
                            </Button>
                        </Dropdown>
                    </div>))
                }
            </div>
        )
    }
}

function genMenu({menuIndex,options,menuSelect}){
    return (<Menu onClick={({key})=>{
        menuSelect(menuIndex,key);
    }}>
        {
            options.map((item,index)=>(
                <Menu.Item key={index}>
                    <div className={item.selected?style.selectedNode:style.menuNode}>
                        {item.name}
                    </div>
                </Menu.Item>
            ))
        }
    </Menu>)
}

export default ToolBox;