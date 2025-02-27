import React, { useState } from "react";
import axios from "axios";
import { Button, Form, Input, message, Modal , Alert, Row, Col} from "antd";
import config from "../config";
import { MessageFilled } from "@ant-design/icons";

message.config({
    getContainer: () => document.getElementsByClassName("catalogue-of-life")[0],
});

const ErrorMessage = ({ error }) => {

if(error.response.status === 503){
    return "The feedback system is currently not available, please try again later."
} else if(error.response.status === 400){
    return "Invalid data submitted"
} else {
    return error?.message || "An error occurred"
}
}


export const Feedback = ({ datasetKey, taxonKey }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
const [error, setError] = useState(null);
  const onFinishFailed = ({ errorFields }) => {
    form.scrollToField(errorFields[0].name);
  };
  const submitData = (values) => {
    
    axios
      .post(
        `${config.dataApi}dataset/${datasetKey}/nameusage/${taxonKey}/feedback`,
        values
      )
      .then((res) => {
        message.success("Feedback submitted successfully");
      })
      .catch((err) => {
        setLoading(false);
        setError(err);
      });
  };
  const layout = {
    labelCol: {
      span: 4,
    },
    wrapperCol: {
      span: 20,
    },
  };
  return (
    <>
      <Modal
        getContainer={".catalogue-of-life"}
        title="Feedback"
        visible={visible}
        onOk={() => {
          setLoading(true);
          form
            .validateFields()
            .then((values) => {
              form.resetFields();
              return submitData(values);
            })
            .then(() => {
              setVisible(false);
              setLoading(false);
            })
            .catch((info) => {
                setLoading(false);
              console.log("Validate Failed:", info);
            })
            
        }}
        onCancel={() => setVisible(false)}
        confirmLoading={loading}
      >
        {error && <Alert
          style={{ marginBottom: "10px" }}
          message={<ErrorMessage error={error} />}
          type="error"
          onClose={() => setError(null)}
          closable
        />}
        <p>
        We will create a <a href="https://github.com/CatalogueofLife/data/issues" target="_blank">github issue</a> which you can monitor or use to further discuss with us.</p>
        <Form
          {...layout}
          
          form={form}
          onFinish={submitData}
          onFinishFailed={onFinishFailed}
        >
          <Form.Item name="message" label="Message" rules={[{required: true}]}>
            <Input.TextArea rows={8} />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              {
                type: "email",
              },
              {required: true}
            ]}
          >
            <Input type="email" />
          </Form.Item>
        </Form>
      </Modal>
      <Row><Col flex="auto"></Col><Col></Col><Button style={{marginTop: "12px"} }size="small" onClick={() => setVisible(true)}>Feedback <MessageFilled /></Button></Row>
      
    </>
  );
};
