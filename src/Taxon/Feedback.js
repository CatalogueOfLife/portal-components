import React, { useState } from "react";
import axios from "axios";
import { Button, Form, Input, message, Modal , Spin,  Alert, Row, Col} from "antd";
import config from "../config";
import { MessageFilled } from "@ant-design/icons";
import { set } from "lodash";

const axiosNoAuth = axios.create({
  transformRequest: (data, headers) => {
      delete headers.common.Authorization;
      headers["Content-Type"] = "application/json";
      return JSON.stringify(data);
  }
})

message.config({
    getContainer: () => document.getElementsByClassName("catalogue-of-life")[0],
});

const getMsg = (error) => {
    
        return error?.response?.data?.message || error?.message || "An error occurred"
    
}
const ErrorMessage = ({ error }) => {

return <div style={{margin: "6px"}}><span>{getMsg(error)}</span></div>

}


export const Feedback = ({ datasetKey, taxonKey }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState(null);
  const [issueUrl, setIssueUrl] = useState(null);
const onFinishFailed = ({ errorFields }) => {
    form.scrollToField(errorFields[0].name);
  };
  const submitData = (values) => {
    axiosNoAuth
      .post(
        `${config.dataApi}dataset/${datasetKey}/nameusage/${taxonKey}/feedback`,
        values
      )
      .then((res) => {
        console.log(res);
        setLoading(false);
        setIssueUrl(res.data);
      })
      .catch((err) => {
        setLoading(false);
        setError(err);
      });
  };
  const layout = {
    labelCol: {
      span: 6,
    },
    wrapperCol: {
      span: 18,
    },
  };
  return (
    <>
      <Modal
        getContainer={".catalogue-of-life"}
        title="Feedback"
        visible={visible}
        destroyOnClose={true}
        onOk={() => {
          if(issueUrl){
              setVisible(false);
              setIssueUrl(null);
              return;
          } else {
            setLoading(true);
            form
            .validateFields()
            .then((values) => {
              form.resetFields();
              return submitData(values);
            })
          }        
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

        {issueUrl && <p>Thank you, your feedback was saved. You can follow for progress and further discussion <a target="_blank" href={issueUrl}>here.</a></p>}
        
       {!issueUrl && <> <p>
        We will create a <a href="https://github.com/CatalogueofLife/data/issues" target="_blank">github issue</a> which you can monitor or use to further discuss with us.
        </p>
        <Spin spinning={loading}>
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
            label="Email (optional)"
            rules={[
              {
                type: "email",
              }
            ]}
          >
            <Input type="email" />
          </Form.Item>
        </Form>
        </Spin></>}
      </Modal>
      <Row><Col flex="auto"></Col><Col></Col><Button style={{marginTop: "12px"} }size="small" onClick={() => setVisible(true)}>Feedback <MessageFilled /></Button></Row>
      
    </>
  );
};
