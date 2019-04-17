import './index.scss';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

@connect(
  state => {
    return {
      projectMsg: state.project.currProject
    };
  },
  {}
)
class DocPage extends Component {
  constructor(props) {
    super(props);
  }

  static propTypes = {
    match: PropTypes.object,
    projectMsg: PropTypes.object
  };


  render() {
    const { match } = this.props;

    return (
      <div className="g-row">
        <iframe className="m-panel yapi-doc" src={"/api/plugin/doc?pid=" + match.params.id} width="100%" style={{minHeight: "calc(100vh - 156px)"}}></iframe>
      </div>
    );
  }
}

export default DocPage;
