import { connect } from 'react-redux';
import React from 'react';
import { getSelectedNoteId } from '../selectors/notes';
import { setSelectedNote, setToDeleteNote } from '../actions/notes';
import { Link } from 'react-router-dom';

class NoteExplorerItem extends React.Component {
  handleClickNoteItem = (e, note) => {
    if (note._id === this.props.selectedNoteId) {
      e.preventDefault();
    }
    this.props.setSelectedNote(note);
  };

  handleClickDeleteNote = (note) => {
    this.props.setToDeleteNote(note);
  };

  render() {
    const { note, selectedNoteId } = this.props;
    return (
      <Link
        to={`/${note._id}`}
        className={`list-group-item list-group-item-action ${selectedNoteId === note._id ? 'active' : ''}`}
        onClick={(e) => this.handleClickNoteItem(e, note)}
      >
        <div className="row no-gutters">
          <div className="col-10">
            <b>{note.title ? note.title : 'No title'}</b>
          </div>
          <div className="col-2 text-right">
            <i
              className="far fa-trash-alt btn-icon btn-danger"
              onClick={() => this.handleClickDeleteNote(note)}
            ></i>
          </div>
        </div>
        <p
          className="text-muted note-item-summary"
          dangerouslySetInnerHTML={{ __html: note.content ? note.content : 'No content' }}
        >
        </p>
      </Link>
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
