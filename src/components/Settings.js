import React from 'react';
import { connect } from 'react-redux';
import { getConfigState, getConfig } from '../selectors/config';
import { setConfig } from '../actions/config';

class Settings extends React.Component {
  handleConfigChange = (e, definition) => {
    this.props.setConfig(definition.name, e.target.value);
  };

  render() {
    return (
      <div className="container-fluid py-3">
        <h4>Settings</h4>
        {this.props.definitions.map((definition) => {
          switch (definition.type) {
            case 'menu':
              return (
                <div className="form-group row" key={definition.name}>
                  <label htmlFor={definition.name} className="col-auto col-form-label">{definition.name}</label>
                  <div className="col-6">
                    <select
                      className="form-control"
                      id={definition.name}
                      value={this.props.config[definition.name]}
                      onChange={(e) => this.handleConfigChange(e, definition)}
                    >
                      {definition.values.map((value) => (
                        <option value={value} key={value}>{value}</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            default:
              return null;
          }
        })}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  definitions: getConfig(state, 'definitions'),
  config: getConfigState(state),
});

export default connect(
  mapStateToProps,
  {
    setConfig,
  },
)(Settings);
