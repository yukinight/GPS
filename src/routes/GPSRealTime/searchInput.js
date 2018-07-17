import React from 'react';
import style from './searchInput.less';
import {Select,Icon,Tooltip,AutoComplete} from 'antd';
const {Option} = Select;

function SearchInput(props) {
    // 传参数
    const {searchOption,searchWay,searchVal,searchList} = props.data;
    // 传方法
    const {changeSearchWay,changeSearchValue,fuzzySearch,search} = props;

    return (
        <div className={style.outerct} >
            <Select style={{width:90}} value={searchWay} onChange={(val)=>{
                changeSearchWay(val)
            }}>
                {
                    searchOption.map((item)=>{
                        return <Option key={item.id}>{item.title}</Option>
                    })
                }
            </Select>
            <AutoComplete 
            dataSource={searchList.map((item)=>item.value)}
            placeholder="模糊搜索"
            value={searchVal} 
            onChange={(val)=>changeSearchValue(val)} 
            onSearch={(val)=>fuzzySearch(val)}
            // onBlur={serachMatchOnBlur}
            
            />
            <Tooltip title='清除搜索文本'>
            <div className={style.clear} onClick={()=>{
                    changeSearchValue('');
            }}>
                <Icon type="close" />
            </div>
        
            </Tooltip>
            <Tooltip title='搜索'>
                <div className={style.search} onClick={()=>{
                    search();
                }}>
                    <Icon type="search"/>
                </div>
            
            </Tooltip>
            <Tooltip title='刷新'>
                <div className={style.refresh} onClick={()=>{
                    search();
                }}> 
                    <Icon type="reload" />
                </div>
            
            </Tooltip>
        </div>
    );
}

export default SearchInput;
