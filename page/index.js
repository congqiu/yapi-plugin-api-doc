import './index.scss';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { Form, Switch, message} from "antd";
const FormItem = Form.Item;

const formItemLayout = {
  labelCol: {
    lg: { span: 5 },
    xs: { span: 24 },
    sm: { span: 10 }
  },
  wrapperCol: {
    lg: { span: 16 },
    xs: { span: 24 },
    sm: { span: 12 }
  },
  className: "form-item"
};

export default class DocPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      setting: {},
      loading: true
    };
  }

  static propTypes = {
    match: PropTypes.object
  };

  async componentDidMount() {
    await this.getSetting();
  }

  async getSetting() {
    let id = this.props.match.params.id;
    let result = await axios.get('/api/plugin/fine/document/setting?project_id=' + id);
    if (result.data.errcode === 0) {
      if (result.data.data) {
        this.setState({
          setting: result.data.data
        });
      }
    }
    this.setState({
      loading: false
    });
  }
  onChange = v => {
    this.setState({
      loading: true
    });
    this.onSave(v);
  }

  async onSave(v) {
    let result = {};
    let id = this.props.match.params.id;
    let params = {
      project_id: id,
      is_public: v
    };
    result = await axios.post("/api/plugin/fine/document/setting/save", params);
    if (
      result.data &&
      result.data.errcode &&
      result.data.errcode !== 40011
    ) {
      message.error(result.data.errmsg);
    } else {
      message.success("保存成功");
      this.setState({
        setting: params
      });
    }
    this.setState({
      loading: false
    });
  }
  
  render() {
    const { match } = this.props;

    return (
      <div className="g-row">
        <FormItem
          label="是否开放公开接口"
          {...formItemLayout}
        >
          <Switch
            checked={this.state.setting.is_public}
            loading={this.state.loading}
            onChange={this.onChange}
            checkedChildren="开"
            unCheckedChildren="关"
          />
          <span
            className="yapi-public-dock"
            style={{
              display: this.state.setting.is_public ? "" : "none"
            }}>
            <a target="_blank" href={"/api/public/plugin/doc?pid=" + match.params.id}>
              {`点击访问无需登录地址 ${window.location.origin}/api/public/plugin/doc?pid=${match.params.id}`}
            </a>
          </span>
        </FormItem>
        <iframe className="m-panel yapi-doc" src={"/api/plugin/doc?pid=" + match.params.id} width="100%" style={{minHeight: "calc(100vh - 156px)"}}></iframe>
      </div>
    );
  }
}