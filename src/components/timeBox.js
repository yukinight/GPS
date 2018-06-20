import React from 'react';

class TimeBox extends React.Component{
    componentDidMount(){
        this.timer = setInterval(()=>{this.refreshTime()},1000);
    }
    componentWillUnmount(){
        clearInterval(this.timer);
    }
    constructor(props){
        super(props);
        this.state = {
            currentTime:this.getCurrentTime()
        }
    }
    refreshTime(){
        this.setState({
            currentTime:this.getCurrentTime()
        })
    }
    formatNum(num){
        if(num<10)
            return `0${num}`;
        else 
            return num;
    }
    getCurrentTime(){
        const d = new Date();
        return `${d.getFullYear()}-${this.formatNum(d.getMonth()+1)}-${this.formatNum(d.getDate())} ${this.formatNum(d.getHours())}:${this.formatNum(d.getMinutes())}:${this.formatNum(d.getSeconds())}`
    }
    render(){
        return (
            <span>
                {this.state.currentTime}
            </span>
        )
    }
}

export default TimeBox;