import React, { Component } from 'react';
import axios from 'axios';
import { Layout, Tooltip, Icon, Row, Tree} from "antd";
const TreeNode = Tree.TreeNode;
const { Content, Sider } = Layout;
import { arrayChangeIndex } from 'client/common.js';

import './index.scss';

export default class FineDocSettingPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      projectData: [],
      expands: null
    };
  }

  async componentDidMount() {
    await this.getSetting();
  }

  async getSetting() {
    let result = await axios.get('/api/plugin/fine/document');
    if (result.data.errcode === 0) {
      if (result.data.data) {
        this.setState({
          projectData: result.data.data
        });
      }
    }
  }

  onDrop = async e => {
    console.log("drop", e)
    const fromNode = e.dragNode.props.eventKey;
    const toNode = e.node.props.eventKey;

    const dropPos = e.node.props.pos.split('-');
    const dropIndex = Number(dropPos[dropPos.length - 1]);
    const dragPos = e.dragNode.props.pos.split('-');
    const dragIndex = Number(dragPos[dragPos.length - 1]);

    const { projectData } = this.state;

    // 移动分组
    if (fromNode.indexOf("group_") > -1 && toNode.indexOf("group_") > -1) {
      let changes = arrayChangeIndex(projectData, dragIndex, dropIndex);
      axios.post("/api/plugin/fine/document/group/up_index", changes);

      let oldDatas = {};
      for (let i = 0; i < projectData.length; i++) {
        const oldData = projectData[i];
        oldDatas[oldData._id] = oldData;
      }

      this.setState({
        projectData: changes.map(v => {
          return Object.assign({}, oldDatas[v.id], v);
        })
      })
    }

    // 移动项目
    if (fromNode.indexOf("project_") > -1 && toNode.indexOf("project_") > -1) {
      const dropGroupIndex = Number(dropPos[1]);
      // 相同分组下的才能移动
      if (dropGroupIndex === Number(dragPos[1])) {
        let projectChanges = arrayChangeIndex(projectData[dropGroupIndex].projects, dragIndex, dropIndex);
        axios.post("/api/plugin/fine/document/up_index", projectChanges);

        let oldDatas = {};
        for (let i = 0; i < projectData[dropGroupIndex].projects.length; i++) {
          const oldData = projectData[dropGroupIndex].projects[i];
          oldDatas[oldData._id] = oldData;
        }
        projectData[dropGroupIndex].projects = projectChanges.map(v => {
          return Object.assign({}, oldDatas[v.id], v);
        });
        
        this.setState({
          projectData: projectData
        })
      }
    }
  };

  render() {
    const { projectData } = this.state;

    const itemProjectCreate = item => {
      return (
        <TreeNode
          title={
            <div
              className="container-title"
            >
              {item.name}
            </div>
          }
          key={"project_" + item._id}
        />
      );
    };

    return (
      <div className="g-row fine-doc-setting">
        <Layout style={{ minHeight: 'calc(100vh - 156px)', marginLeft: '24px', marginTop: '24px' }}>
          <Sider style={{ height: '100%' }} width={300}>
            <div className="left-menu">
              <Row className="tabs-large">
                <div className="test-icon-style">
                  <h3>
                    文档分组列表&nbsp;<Tooltip placement="top" title="拖动调整文档顺序">
                      <Icon type="question-circle-o" />
                    </Tooltip>
                  </h3>
                </div>
              </Row>
              <Tree
                className="draggable-tree"
                draggable
                blockNode
                onDragEnter={this.onDragEnter}
                onDrop={this.onDrop}
              >
                {projectData.map(item => {
                  return (
                    <TreeNode
                      title={
                        <div
                          className="container-title"
                        >
                          {item.group_name}
                        </div>
                      }
                      key={"group_" + item._id}
                      className={"interface-item-nav"}
                    >
                      {item.projects.map(itemProjectCreate)}
                    </TreeNode>
                  );
                })}
              </Tree>
            </div>
          </Sider>
          <Layout className="test-content">
            <Content style={{
                        padding: 24,
                        textAlign: "center"
                      }}>
            </Content>
          </Layout>
        </Layout>
      </div>
    );
  }
}