import './index.scss';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class DocPage extends Component {
  constructor(props) {
    super(props);
  }

  static propTypes = {
    match: PropTypes.object
  };


  render() {
    const { match } = this.props;

    return (
      <div className="g-row">
        <div className="yapi-public-dock">
          <a target="_blank" href={"/api/public/plugin/doc?pid=" + match.params.id}>
            {`对外建议使用公开接口 ${window.location.origin}/api/public/plugin/doc?pid=${match.params.id}`}
          </a>
        </div>
        <iframe className="m-panel yapi-doc" src={"/api/plugin/doc?pid=" + match.params.id} width="100%" style={{minHeight: "calc(100vh - 156px)"}}></iframe>
      </div>
    );
  }
}