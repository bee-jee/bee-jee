import React from 'react';
import { connect } from 'react-redux';
import { fetchNotes, createNote, deleteNote, setToDeleteNote } from '../actions/notes';
import { getNotes, getIsLoading, getToDeleteNote } from '../selectors/notes';
import NoteExplorerItem from './NoteExplorerItem';
import UtilityBar from './UtilityBar';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { getConfig, toContentType } from '../selectors/config';

class NoteExplorer extends React.Component {
  handleCreateNote = () => {
    this.props.createNote({ title: '', content: '', contentType: this.props.defaultContentType });
  }

  handleCloseDelete = () => {
    this.props.setToDeleteNote({ _id: '' });
  };

  handleDeleteNote = () => {
    const { toDeleteNote, deleteNote } = this.props;
    deleteNote(toDeleteNote);
    this.handleCloseDelete();
  };

  componentDidMount() {
    this.props.fetchNotes();
  }

  render() {
    const { toDeleteNote } = this.props;
    return (
      <div className="note-explorer">
        <div className="col-12 py-3">
          <div className="row no-gutters">
            <div className="col-10">
              <h4>Notes</h4>
            </div>
            <div className="col-2 text-right">
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={this.handleCreateNote}
              ><i className="fas fa-plus"></i></button>
            </div>
          </div>
        </div>
        {
          this.props.isLoading ? (
            "Loading . . ."
          ) : (
              <div className="list-group note-eplorer-content">
                {this.props.notes.length !== 0 ? this.props.notes.map((note) => (
                  <NoteExplorerItem
                    key={`note-${note._id}`}
                    note={note}
                  />
                )) : <div className="col-12">No notes, you can create one by click "+" button</div>}
              </div>
            )
        }

        <UtilityBar />

        <Modal
          show={toDeleteNote._id !== ''}
          onHide={this.handleCloseDelete}
        >
          <Modal.Header closeButton>
            <Modal.Title>Delete "{toDeleteNote.title}"</Modal.Title>
          </Modal.Header>
          <Modal.Footer>
            <Button variant="secondary" onClick={this.handleCloseDelete}>
              Close
            </Button>
            <Button variant="danger" onClick={this.handleDeleteNote}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  notes: getNotes(state),
  isLoading: getIsLoading(state),
  toDeleteNote: getToDeleteNote(state),
  defaultContentType: toContentType(getConfig(state, 'defaultEditorEditType')),
});

export default connect(
  mapStateToProps,
  {
    fetchNotes,
    createNote,
    deleteNote,
    setToDeleteNote,
  },
)(NoteExplorer);
