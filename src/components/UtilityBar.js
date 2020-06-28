import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { getIsSyncing } from '../selectors/notes';

class UtilityBar extends React.Component {
  render() {
    return (
      <div className="col-12 utility-bar py-2 row">
        <div className="col-auto">
          <Link to="/settings" className="btn-icon btn-primary">
            <i className="fas fa-cog"></i>
          </Link>
        </div>
        <div className="col-auto">
          {this.props.isSyncing ? (
            <div className="spinner spinner-grow spinner-grow-sm text-primary" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          ) : null}
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state) => ({
  isSyncing: getIsSyncing(state),
});

export default connect(
  mapStateToProps,
  {},
)(UtilityBar);
