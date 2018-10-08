import React from 'react';
import { Column, Table,AutoSizer } from 'react-virtualized';
import styles from './scrollTable.less';
import 'react-virtualized/styles.css';
import {deepEqual} from '../../utils/util';

class ScrollTable extends React.Component{
    constructor(props){
        super()
        this.state = {
            rowHeight: 40,
            totalHeight:280,
            topIndex:0,
            width:0,
            avgWidth:80
        }
        this.virtualizedTable = null;
        this.scrollTimeout = null;
        this.isIE = window.navigator.userAgent.indexOf("MSIE")>=1;
    }
    shouldComponentUpdate(nextProps, nextState){
        if(deepEqual(this.state,nextState) && deepEqual(this.props.data,nextProps.data)){
            return false;
        }
        else{
            return true;
        }
    }
    componentDidMount(){
        if(typeof this.props.onScroll == 'function'){
            this.props.onScroll(0);
        }
    }
    componentDidUpdate(){
        if(typeof this.props.onScroll == 'function'){
            this.props.onScroll(this.state.topIndex);
        }
    }
    // 表格滚动到某个index位置
    scrollToIndex(index){
        // this.virtualizedTable.scrollToPosition(index*this.state.rowHeight);
        this.virtualizedTable.scrollToRow(index);
    }
    // 计算列的平均宽度
    getAvgWidth(total,num,widthList){
        if(num===0)return 80;
        if(widthList.length===0)return parseInt(total/num); 
        // widthList = [...widthList];
        widthList.sort((a,b)=>a-b);
        const maxWidth = widthList.pop();
        if(total/num>=maxWidth){
            return parseInt(total/num);
        }
        else{
            return this.getAvgWidth(total-maxWidth,num-1,widthList);
        }
    }
    onScroll({clientHeight, scrollHeight, scrollTop}){
        if(this.scrollTimeout){
            clearTimeout(this.scrollTimeout);
        }
        this.scrollTimeout = setTimeout(()=>{
            const currentRowIndex = parseInt(scrollTop/this.state.rowHeight);
            this.setState({
                topIndex:currentRowIndex
            });
            if(typeof this.props.onScroll == 'function'){
                this.props.onScroll(currentRowIndex);
            } 
        },300);
    }
    _rowClassName({index}){
        if (index < 0) {
            return styles.headerRow;
        } else if(index==this.props.data.highlightRowIndex){
            return styles.highlightRow;
        }
        else{
            return index % 2 === 0 ? styles.evenRow : styles.oddRow;
        }
    }
    _noRowsRenderer() {
        return <div className={styles.noRows}>暂无数据</div>;
      }
    render(){
        const {onScroll,rowClick} = this.props;
        const {columns,tableData,scrollToIndex} = this.props.data;
        const t = this;
        
        return (
            <div className={styles.normal} >
               <AutoSizer disableHeight onResize={({width})=>{
                   if(width!==t.state.width){
                        t.setState({
                            width,
                            avgWidth:t.getAvgWidth(width-100,columns.length,columns.filter((item)=>item.width).map(item=>item.width))-10
                        })
                    }
               }} >
                    {({ width })=>{
                      
                        return (
                        <Table
                            ref={(ins)=>{if(ins)t.virtualizedTable=ins}}
                            width={width}
                            height={t.state.totalHeight}
                            headerHeight={t.state.rowHeight}
                            rowHeight={t.state.rowHeight}
                            headerClassName={styles.cellForIE}
                            rowClassName={this._rowClassName.bind(t)}
                            noRowsRenderer={this._noRowsRenderer}
                            rowCount={tableData.length}
                            rowGetter={({ index }) => tableData[index]}
                            onRowClick={({event, index, rowData})=>{
                                rowClick && rowClick(rowData,index);
                            }}
                            scrollToIndex={scrollToIndex}
                            onScroll={t.onScroll.bind(t)}
                            overscanRowCount={10}
                        >
                            <Column
                                label=" "
                                dataKey="index"
                                cellRenderer={({rowIndex}) =>rowIndex+1 }
                                width={50}
                                headerStyle={{width:'50px'}}
                                style={{width:'50px'}}
                                flexShrink={0}
                                className={styles.cellForIE}
                            />
                            {
                                columns.map((item)=> <Column
                                    {...item}
                                    key={item.dataKey}                             
                                    width={t.state.avgWidth}
                                    minWidth={item.width}
                                    headerStyle={{width:`${t.state.avgWidth}px`}}
                                    style={{width:`${t.state.avgWidth}px`}}
                                    className={styles.cellForIE}
                                />)
                            }
                        </Table>
                        )
                    }}
                </AutoSizer>
               
            </div>
        );
    }
}

export default ScrollTable;