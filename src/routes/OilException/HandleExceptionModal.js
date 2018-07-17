/*油耗异常 处理*/
import React from 'react';
import { Modal, Button, Form, Row, Col, Select,Input } from 'antd';
const FormItem = Form.Item;
const { TextArea } = Input;
const {Option} = Select;
class HandleExceptionModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: false,
        }
    }
    //打开弹窗
    showModalHandler = () => {
        this.props.dispatch({
            type:'oilException/updateState',
            payload:{
                handleResult:'1',
                handleReason:'',
            }
        })
        this.setState({
            visible: true
        })
    }

    //关闭弹窗
    hideModalHandler = () => {
        this.setState({
            visible: false,
        })
    }
    //修改处理结果
    changeHandleResult=(value)=>{
        this.props.dispatch({
            type: 'oilException/updateState',
            payload: {
                handleResult: value,
            }
        })
    }
    //修改处理原因
    changeHandleReason=(e)=>{
        this.props.dispatch({
            type: 'oilException/updateState',
            payload: {
                handleReason: e.target.value,
            }
        })
    }
    //提交
    handleSubmit=(e)=>{
        const {id} = this.props;
        e.preventDefault();
        this.props.form.validateFieldsAndScroll((err, values) => {
            if (!err) {
                this.props.dispatch({
                    type:'oilException/handleException',
                    payload:{
                        id
                    }
                })
                this.setState({
                    visible: false,
                })
            }
        });
    }
    render(){
        const { children } = this.props;
        const t = this;
        const formItemLayout = {
            labelCol: { span: 6 },
            wrapperCol: { span: 16 }
        }
        const { getFieldDecorator } = this.props.form;
        const { carCode, carClassesName, exceptionTypeName, beforeOilMass, afterOilMass, exceptionOilMass, exceptionTime,
             exceptionAddress, } = this.props.record;
        const { handleResult,handleReason} = this.props;
        return (
            <span>
                <span onClick={this.showModalHandler}>
                    {children}
                </span>
                <Modal
                    visible={this.state.visible}
                    onCancel={this.hideModalHandler}
                    maskClosable={false}
                    width={800}
                    title={<span>油耗异常查询 > 油耗异常处理</span>}
                    footer={([
                        <Button type="primary" key='back'  size="large" onClick={this.hideModalHandler}>返回</Button>,
                        <Button type="primary" key='save' htmlType="submit" size="large" onClick={this.handleSubmit}>保存</Button>,
                    ])}
                    bodyStyle={{ background: '#fbfbfb' }}
                >
                    <Form>
                        <Row>
                            <Col span={12}>
                                <FormItem
                                    label="车牌号"
                                    {...formItemLayout}
                                >
                                    {
                                        getFieldDecorator('carCode', {
                                            initialValue: carCode
                                        })(
                                            <span className="ant-form-text">{carCode}</span>
                                        )
                                    }
                                </FormItem>
                            </Col>
                            <Col span={12}>
                                <FormItem
                                    label="车辆类型"
                                    {...formItemLayout}
                                >
                                    {
                                        getFieldDecorator('carClassesName', {
                                            initialValue: carClassesName
                                        })(
                                            <span className="ant-form-text">{carClassesName}</span>
                                        )
                                    }
                                </FormItem>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={12}>
                                <FormItem
                                    label="异常类型"
                                    {...formItemLayout}
                                >
                                    {
                                        getFieldDecorator('exceptionTypeName', {
                                            initialValue: exceptionTypeName
                                        })(
                                            <span className="ant-form-text">{exceptionTypeName}</span>
                                        )
                                    }
                                </FormItem>
                            </Col>
                            <Col span={12}>
                                <FormItem
                                    label="减少前油量"
                                    {...formItemLayout}
                                >
                                    {
                                        getFieldDecorator('beforeOilMass', {
                                            initialValue: beforeOilMass ? (beforeOilMass + 'L') : ''
                                        })(
                                            <span className="ant-form-text">{beforeOilMass ? (beforeOilMass + 'L') : ''}</span>
                                        )
                                    }
                                </FormItem>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={12}>
                                <FormItem
                                    label="减少后油量"
                                    {...formItemLayout}
                                >
                                    {
                                        getFieldDecorator('afterOilMass', {
                                            initialValue: afterOilMass ? (afterOilMass + 'L') : ''
                                        })(
                                            <span className="ant-form-text">{afterOilMass ? (afterOilMass + 'L') : ''}</span>
                                        )
                                    }
                                </FormItem>
                            </Col>
                            <Col span={12}>
                                <FormItem
                                    label="减少油量"
                                    {...formItemLayout}
                                >
                                    {
                                        getFieldDecorator('exceptionOilMass', {
                                            initialValue: exceptionOilMass ? (exceptionOilMass + 'L') : ''
                                        })(
                                            <span className="ant-form-text">{exceptionOilMass ? (exceptionOilMass + 'L') : ''}</span>
                                        )
                                    }
                                </FormItem>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={24}>
                                <FormItem
                                    label="异常时间"
                                    labelCol={{ span: 3 }}
                                    wrapperCol={{ span: 19 }}
                                >
                                    {
                                        getFieldDecorator('exceptionTime', {
                                            initialValue: exceptionTime
                                        })(
                                            <span className="ant-form-text">{exceptionTime}</span>
                                        )
                                    }
                                </FormItem>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={24}>
                                <FormItem
                                    label="异常地址"
                                    labelCol={{ span: 3 }}
                                    wrapperCol={{ span: 19 }}
                                >
                                    {
                                        getFieldDecorator('exceptionAddress', {
                                            initialValue: exceptionAddress
                                        })(
                                            <span className="ant-form-text">{exceptionAddress}</span>
                                        )
                                    }
                                </FormItem>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={12}>
                                <FormItem
                                    label="处理结果"
                                    {...formItemLayout}
                                >
                                    {
                                        getFieldDecorator('handleResult', {
                                            initialValue: handleResult,
                                            rules:[{
                                                required:true, message: '请选择处理结果',
                                            }],
                                        })(
                                            <Select onChange={t.changeHandleResult}>
                                                <Option key='1' value='1'>通过</Option>
                                                <Option key='-1' value='-1'>不通过</Option>
                                            </Select>
                                        )
                                    }
                                </FormItem>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={24}>
                                <FormItem
                                    label="处理原因"
                                    labelCol={{ span: 3 }}
                                    wrapperCol={{ span: 19 }}
                                >
                                    {
                                        getFieldDecorator('handleReason', {
                                            initialValue: handleReason,
                                            rules: [{
                                                required: true, message: '请输入处理原因',
                                            }],
                                        })(
                                            <TextArea  onChange={t.changeHandleReason} autosize={{ minRows: 2, maxRows: 6 }}/>
                                        )
                                    }
                                </FormItem>
                            </Col>
                        </Row>
                    </Form>
                </Modal>
            </span>
        )
    }
}
export default Form.create()(HandleExceptionModal);