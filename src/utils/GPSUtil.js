import {GPS_ICON} from './iconMap';

// 处理车辆树的图标
function getTreeIcon(node) {
    if(!node.icon){
        switch(node.nodeType){
            case 'Root': return GPS_ICON.tree.root;
            case 'department': return GPS_ICON.tree.department;
            case 'car':
                switch(node.attributes.carStatus){
                    case '行驶在线':return GPS_ICON.tree.carOn;
                    case '停车在线':return GPS_ICON.tree.carStop;
                    case '离线':return GPS_ICON.tree.carOff;
                }
            default: return '';
        }
    }
    else{
        return node.icon;
    }
}

export class carTreeDataProcessor{
    constructor(rawData){
        this.treeNodes = [];
        this.carNodeIds = [];
        this.parentNodeIds = [];
        this.newTree = this.generateNewTree(rawData);
    }
    generateNewTree(rawData){
        return rawData.map((item)=>{
            const {children,...node} = item;
            this.treeNodes.push(node);
            if(Array.isArray(item.children) && item.children.length>0){
                this.parentNodeIds.push(item.id);
                return {
                    name: item.name,
                    key: item.id,
                    isLeaf: item.nodeType=='car',
                    img: getTreeIcon(item),
                    children: this.generateNewTree(item.children)
                }
            }
            else{
                if(item.nodeType=='car'){
                    this.carNodeIds.push(item.id);
                }
                return {
                    name: item.name,
                    key: item.id,
                    attributes: item.attributes,
                    isLeaf: item.nodeType=='car',
                    img: getTreeIcon(item),
                }
            }
        })
    }
    getNewTree(){
        return this.newTree;
    }
    getNodes(){
        return this.treeNodes;
    }
    getCarNodeIds(){
        return this.carNodeIds;
    }
    getParentNodeIds(){
        return this.parentNodeIds;
    }
}

// 秒转化为时间的格式化字符串
export function secondToFormatTime(times){
    if(!times)return '';
    let timeStr='';
    let remain = parseInt(times);

    let days = parseInt(remain/(24*60*60));
    if(days)timeStr+=`${days}天`;
   
    remain = remain%(24*60*60);
    let hours = parseInt(remain/(60*60))
    if(hours)timeStr+=`${hours}小时`;

    remain = remain%(60*60);
    let minutes = parseInt(remain/60);
    if(minutes)timeStr+=`${minutes}分`;

    let seconds = remain%60;
    timeStr+=`${seconds}秒`;
   
    return timeStr;
}

// 根据选择显示字段处理树的显示数据
export function getNewCarNameTree(carTreeData,showKeys){
    if(showKeys.length==0)return carTreeData;
    
    return carTreeData.map((item)=>{
        if(item.isLeaf){
            let nameArray = showKeys.map((label)=>{
                switch(label){
                    case '驾驶员':return item.attributes.driver;
                    case '状态':return item.attributes.carStatus;
                    case '统计':return secondToFormatTime(item.attributes.stopTime);
                    case '车型':return item.attributes.carClasses;
                    default:return '';
                }
            }).filter(val=>val);
            nameArray.unshift(item.attributes.carCode);
            return {
                ...item,
                name:nameArray.join(' ')
            }
        }
        else if(item.children){
            return {
                ...item,
                children:getNewCarNameTree(item.children,showKeys)
            };
        }
        else{
            return {...item}
        }
    })
}

// 合并地图元素（必须数组合并）
export function mergeMapElems(mainObj,subObj) {
    let mergedObj = {...mainObj};
    for(let key in subObj){
        if(Array.isArray(mergedObj[key]) && mergedObj[key].length>0){
            mergedObj[key] = [...mergedObj[key],...subObj[key]];
        }
        else{
            mergedObj[key] = subObj[key];
        }
    }
    return mergedObj;
}