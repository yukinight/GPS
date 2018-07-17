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
            topIndex:0
        }
        this.virtualizedTable = null;
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
    //对比对象数据是否相等
    deepEqual(a,b){
        return Immutable.is(Immutable.fromJS(a),Immutable.fromJS(b));
    }
    // 表格滚动到某个index位置
    scrollToIndex(index){
        this.virtualizedTable.scrollToPosition(index*this.state.rowHeight);
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
               <AutoSizer disableHeight>
                    {({ width })=>{
                        
                        const widthColumns = columns.filter((item)=>item.width);
                        const restWidth = width-50-widthColumns.reduce((total,item)=>total+item.width,0);
                        const avgWidth = parseInt(restWidth/(columns.length-widthColumns.length));
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
                            onScroll={({clientHeight, scrollHeight, scrollTop})=>{
                                const currentRowIndex = parseInt(scrollTop/t.state.rowHeight);
                                t.setState({
                                    topIndex:currentRowIndex
                                });
                                onScroll && onScroll(currentRowIndex);
                            }}
                        >
                            <Column
                                label=" "
                                cellDataGetter={({rowData}) => rowData.index}
                                dataKey="index"
                                width={50}
                                headerStyle={{width:'50px'}}
                                style={{width:'50px'}}
                                flexShrink={0}
                                className={styles.cellForIE}
                            />
                            {
                                columns.map((item)=> <Column
                                    key={item.dataKey}                             
                                    width={avgWidth}
                                    headerStyle={{width:`${item.width||80}px`}}
                                    style={{width:`${item.width||80}px`}}
                                    className={styles.cellForIE}
                                    {...item} 
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