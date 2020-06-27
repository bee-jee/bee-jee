import React from 'react';
import { connect } from 'react-redux';
import { changeNoteTitle } from '../actions/notes';
import { getSelectedNote, getIsSyncing } from '../selectors/notes';

class NoteEditor extends React.Component {
  updateTitle = (title) => {
    this.props.changeNoteTitle({
      _id: this.props.note._id,
      title,
    });
  }

  render() {
    return (
      <div className="note-editor container-fluid py-3">
        {this.props.note._id ? (
          <div className="row note-editor-container">
            <div className="col-12 form-group">
              <input
                type="text"
                className="form-control"
                placeholder="Title"
                onChange={(e) => { this.updateTitle(e.target.value) }}
                value={this.props.note.title}
              />
            </div>
            <div className="col-12 form-group note-content-editor">
              <textarea className="form-control"></textarea>
            </div>
          </div>
        ) : null}
        {this.props.isSyncing ? (
          <div className="spinner-grow spinner-grow-sm text-primary note-editor-spinner" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        ) : null}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  note: getSelectedNote(state),
  isSyncing: getIsSyncing(state),
});

export default connect(
  mapStateToProps,
  {
    changeNoteTitle,
  },
)(NoteEditor);
