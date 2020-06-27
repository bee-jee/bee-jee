import { connect } from 'react-redux';
import React from 'react';
import { getSelectedNoteId } from '../selectors/notes';
import { setSelectedNote, setToDeleteNote } from '../actions/notes';

class NoteExplorerItem extends React.Component {
  handleClickNoteItem = (note) => {
    this.props.setSelectedNote(note);
  };

  handleClickDeleteNote = (note) => {
    this.props.setToDeleteNote(note);
  };

  render() {
    const { note, selectedNoteId } = this.props;
    return (
      <>
        <button
          className={`list-group-item list-group-item-action ${selectedNoteId === note._id ? 'active' : ''}`}
          onClick={() => this.handleClickNoteItem(note)}
        >
          <div className="row no-gutters">
            <div className="col-10">
              <b>{note.title ? note.title : 'No title'}</b>
            </div>
            <div className="col-2 text-right">
              <i
                className="far fa-trash-alt"
                onClick={() => this.handleClickDeleteNote(note)}
              ></i>
            </div>
          </div>
          <p className="text-muted note-item-summary">
            {note.content ? note.content : 'No content'}
          </p>
        </button>
      </>
    );
  }
}

const mapStateToProps = (state) => ({
  selectedNoteId: getSelectedNoteId(state),
});

export default connect(
  mapStateToProps,
  {
    setSelectedNote,
    setToDeleteNote,
  },
)(NoteExplorerItem);
