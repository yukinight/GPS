import React from 'react';
import ReactDOM from 'react-dom';

// 生成绝对定位的容器
export default class RenderInBody extends React.Component{
    // 参数：{left:20,top:100}
    constructor(props){
        super();
        this.parentDom = null;
    }
    componentWillMount(){
        this.parentDom = $(`<div/>`).appendTo('body').css({
            position:'absolute',
            left:`${this.props.left||0}px`,
            top:`${this.props.top||0}px`,
            'z-index':'2'
        });
    }
    componentDidMount(){
        ReactDOM.render(this.props.children,this.parentDom[0]);
    }
    componentDidUpdate(){
        this.parentDom.css({left:this.props.left||0,top:this.props.top||0});
        ReactDOM.render(this.props.children,this.parentDom[0]);
    }
    componentWillUnmount(){
        this.parentDom.remove();
    }
    render(){
        return null;
    }
}