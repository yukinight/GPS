import React from 'react';
import {VtxModal,} from 'vtx-ui';
import {} from 'antd';

export function MarkPointWindow(props){
    return (
        <VtxModal key="iconWindow"
            title='添加标记点'
            visible={markWindow.show}
            width={300}
            onOk={()=>{
                t.updateModel({
                    markWindow:{
                        show:false,
                        pointInfo:{config:{labelContent:''}}
                    },
                    mapCfg:{
                        isCloseDraw:true
                    }
                });
                setTimeout(()=>{
                    t.updateModel({
                        mapCfg:{
                            isCloseDraw:false
                        }
                    })
                },50);
                t.map.updatePoint([markWindow.pointInfo])
            }}
            onCancel={()=>{
                t.updateModel({
                    markWindow:{
                        show:false,
                        pointInfo:{config:{labelContent:''}}
                    },
                    mapCfg:{
                        isCloseDraw:true
                    }
                })
                setTimeout(()=>{
                    t.updateModel({
                        mapCfg:{
                            isCloseDraw:false
                        }
                    })
                },50)
            }}
        >
            <Input value={markWindow.pointInfo.config.labelContent} onChange={(e)=>{
                t.updateModel({
                    markWindow:{
                        pointInfo:{config:{labelContent:e.target.value}}
                    }
                })
            }}/>
        </VtxModal>
    )
}